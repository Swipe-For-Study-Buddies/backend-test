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

const getSuggestions = async function ({ req, res, db }) {

  const mockData =[
    {
      id: '7c64cc320316c6c3017d5e1c7f', // 此 id 必須是之後 backend 可以靠這個 id 得知選取的 user 是誰, 但又不可在雙方同意前將 email 送到 client 端.
      name: 'AAA',
      gender: 'male',
      age: '30',
      job: '',
      interest: ['養魚', '逛街', '健身'],
      skill: ['養魚', '烹飪'],
      wantingToLearn: ['英文', '日文'],
      avatar: '',
    },
    {
      id: '7f67cf320316c6c3017d5e1c7f',
      name: 'BBB',
      gender: 'female',
      age: '22',
      job: '',
      interest: ['看電影', '逛街', '旅行'],
      skill: ['中文', '英文', '日文'],
      wantingToLearn: ['Javascript', 'Python'],
      avatar: '',
    },
    {
      id: '7e66ce320316c6c3017d5e1c7f',
      name: 'CCC',
      gender: 'male',
      age: '27',
      job: '',
      interest: ['爬山', '看書'],
      skill: ['中文'],
      wantingToLearn: ['養魚', '烹飪'],
      avatar: '',
    },
    {
      id: '7961c9320316c6c3017d5e1c7f',
      name: 'DDD',
      gender: 'female',
      age: '31',
      job: '',
      interest: ['旅行', '逛街'],
      skill: ['英文', '日文'],
      wantingToLearn: ['烹飪'],
      avatar: '',
    },
  ];
  return res.json(mockData)
}

const approveSuggestion = async function ({ req, res, db }) {
}

const rejectSuggestion = async function ({ req, res, db }) {
}

const getNotifications = async function ({ req, res, db }) {
}

module.exports = {
  getUserProfile,
  setUserProfile,
  getSuggestions,
  approveSuggestion,
  rejectSuggestion,
  getNotifications,
}
