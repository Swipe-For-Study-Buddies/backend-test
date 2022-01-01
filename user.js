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
    contacts = []
  } = req.body

  try {
    const data = await db.get(email)
    const jsonData = JSON.parse(data)

    const userData = {
      ...jsonData,
      name,
      gender,
      birthday,
      job,
      interest,
      skill,
      wantingToLearn,
      contacts,
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
