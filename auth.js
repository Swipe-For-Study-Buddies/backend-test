const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { encrypt, decrypt } = require('./crypto');

function genRandomString(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

function sha512(password, salt) {
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);
  return hash.digest('hex');
};

function saltHashPassword(password) {
  const salt = genRandomString(16);
  const passwordHash = sha512(password, salt);
  return {
    salt,
    passwordHash
  }
}

function getToken(email) {
  return jwt.sign({ email, timestamp: Date.now() }, 'secret', { algorithm: 'HS256' });
}

const register = async function ({ req, res, db }) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).send({})
  }

  // 要先確認這個 email 沒有註冊過
  let emailExist = true
  try {
    await db.get(email)
  } catch (err) {
    if (err && err.type === 'NotFoundError') {
      emailExist = false
    }
  }

  if (emailExist) {
    return res.status(400).send({ message: 'AccountAlreadyExist' })
  }

  const { salt, passwordHash } = saltHashPassword(password);

  const acToken = genRandomString(16)
  const actExpired = Date.now() + 60 * 60 * 24 * 2 * 1000 // 2天過期
  const hash = encrypt(`${email}:${acToken}`);
  // NOTE: 此處應該寄一封 email 給使用者, 附上啟用帳號的連結
  //       目前先把連結印出來手動在瀏覽器輸入
  console.log('Click this URL:')
  console.log(`http://localhost:3000/activateAccount/${hash}`)

  await db.put(email, JSON.stringify({ salt, passwordHash, acToken, actExpired }))
  return res.status(200).send({ message: 'OK' });
}

const activateAccount = async function ({ req, res, db }) {
  const { token } = req.body
  const content = decrypt(token)
  console.log('content = ', content)

  const s = content.split(':')
  if (s.length !== 2) {
    return res.status(400).send({ message: 'InvalidToken' });
  } else {
    const email = s[0]
    const acToken = s[1]

    try {
      const data = await db.get(email)
      const jsonData = JSON.parse(data)
      const { acToken: acTokenInDb, actExpired, ...userData } = jsonData
      // 把收到的 acToken 和資料庫裡的 token 比對, 並確認 token 尚未過期
      if (acToken !== acTokenInDb) {
        return res.status(400).send({ message: 'InvalidToken' });
      } else if (acTokenInDb < Date.now()) {
        return res.status(400).send({ message: 'TokenExpired' });
      }
      // 移除 db 裡的 acToken
      await db.put(email, JSON.stringify({ ...userData}))

      return res.status(200).send({ message: 'OK' });
    } catch (err) {
      console.log(err)
      return res.status(400).send({ message: 'InvalidToken' });
    }
  }
}

const login = async function ({ req, res, db }) {
  const { email, password } = req.body
  try {
    const data = await db.get(email)
    const jsonData = JSON.parse(data)
    const { acToken, salt, passwordHash, ...userData } = jsonData
    if (acToken) {
      return res.status(400).send({ message: 'NotActivatedAccount' });
    }
    const passwordHashFromClient = sha512(password, salt);
    if (passwordHash === passwordHashFromClient) {
      const token = getToken(email)
      return res.json({ ...userData, token })
    } else {
      return res.status(401).send({ message: 'WrongPassword' });
    }
  } catch (err) {
    if (err.type === 'NotFoundError') {
      return res.status(401).send({ message: 'UserNotFound' });
    }
  }
}

const getResetPasswordToken = async function ({ req, res, db }) {
  const { email } = req.body
  console.log(email)
  try {
    const data = await db.get(email)
    const jsonData = JSON.parse(data)
    console.log(JSON.stringify(jsonData, null, 4))
    const { acToken } = jsonData
    // 如果帳號還沒啟用, 不可以重設密碼
    if (acToken) {
      return res.status(400).send({ message: 'NotActivatedAccount' });
    }
    const rpToken = genRandomString(16)
    const rptExpired = Date.now() + 60 * 60 * 24 * 2 * 1000 // 2天過期
    await db.put(email, JSON.stringify({ ...jsonData, rpToken, rptExpired }))

    const hash = encrypt(`${email}:${rpToken}`);
    // NOTE: 此處應該寄一封 email 給使用者, 附上重設密碼用的連結
    //       目前先把連結印出來手動在瀏覽器輸入
    console.log('Click this URL:')
    console.log(`http://localhost:3000/resetPassword/${hash}`)
    return res.status(200).send({ message: 'OK' });
  } catch (err) {
    console.log(err)
    if (err.type === 'NotFoundError') {
      return res.status(401).send({ message: 'UserNotFound' });
    }
  }
}

const resetPassword = async function ({ req, res, db }) {
  const { password, token } = req.body
  const content = decrypt(token)
  const s = content.split(':')
  if (s.length !== 2) {
    return res.status(400).send({ message: 'InvalidToken' });
  } else {
    const email = s[0]
    const rpToken = s[1]

    try {
      const data = await db.get(email)
      const jsonData = JSON.parse(data)
      const { rpToken: rpTokenInDb, rptExpired, ...userData } = jsonData
      // 把收到的 rpToken 和資料庫裡的 token 比對, 並確認 token 尚未過期

      if (rpToken !== rpTokenInDb) {
        return res.status(400).send({ message: 'InvalidToken' });
      } else if (rptExpired < Date.now()) {
        return res.status(400).send({ message: 'TokenExpired' });
      }
      if (password) {
        // 更新 db 裡的 salt 和 password hash
        const { salt, passwordHash } = saltHashPassword(password);
        await db.put(email, JSON.stringify({ ...userData, salt, passwordHash }))
      }
      return res.status(200).send({ message: 'OK' });
    } catch (err) {
      console.log(err)
      return res.status(400).send({ message: 'InvalidToken' });
    }
  }
}

module.exports = {
  register,
  activateAccount,
  login,
  getResetPasswordToken,
  resetPassword,
}
