const crypto = require('crypto')
const fs = require("fs");

const getUserProfile = async function ({ req, res, db }) {
  const { email } = req.user
  try {
    const data = await db.get(email)
    const jsonData = JSON.parse(data)
    const { salt, passwordHash, rpToken, rptExpired, ...userData } = jsonData
    return res.json(userData)
  } catch (err) {
    if (err.type === 'NotFoundError') {
      return res.status(401).send({ message: 'UserNotFound' });
    }
  }
}

const setUserProfile = async function ({ req, res, db }) {
  const { email } = req.user
  const {
    name = '',
    gender = '',
    birthday = '',
    job = '',
    interest = [],
    skill = [],
    wantingToLearn = [],
    avatar = ''
  } = req.body

  try {
    const data = await db.get(email)
    const jsonData = JSON.parse(data)

    let avatarUrl = ''
    if (avatar) {
      // 把圖片存下來
      const regex = /^data:image\/(.{2,4});/g
      const match = regex.exec(avatar)
      const extName = match.length === 2 ? match[1] : 'jpg'
      var base64 = avatar.replace(`data:image/${extName};base64,`, '');
      const buffer = Buffer.from(base64, 'base64');
      if (!fs.existsSync(`${__dirname}/images`)) {
        fs.mkdirSync(`${__dirname}/images`);
      }

      const hashed = crypto.createHash('md5').update(buffer).digest('base64');
      const fileName = `${hashed}.${extName}`
      fs.writeFileSync(`${__dirname}/images/${fileName}`, buffer);
      avatarUrl = `http://localhost:8080/image/${fileName}`
    }

    const userData = {
      ...jsonData,
      name,
      gender,
      birthday,
      job,
      interest,
      skill,
      wantingToLearn,
      avatar,
    }

    if (avatarUrl) {
      userData.avatar = avatarUrl
    }
    await db.put(email, JSON.stringify(userData))

    const { salt, passwordHash, rpToken, rptExpired, ...newUserData } = userData

    return res.status(200).send(newUserData);
  } catch (err) {
    if (err.type === 'NotFoundError') {
      return res.status(401).send({ message: 'UserNotFound' });
    }
  }
}

module.exports = {
  getUserProfile,
  setUserProfile,
}
