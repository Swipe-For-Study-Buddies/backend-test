const express = require('express')
const cors = require('cors')
const expressJWT = require('express-jwt')
const level = require('level')
const {
  register,
  activateAccount,
  login,
  getResetPasswordToken,
  resetPassword,
} = require('./auth.js')
const {
  getUserProfile,
  setUserProfile,
  getSuggestions,
  approveSuggestion,
  rejectSuggestion,
  getNotifications,
  sendFeedback,
  modifyPassword
} = require('./user.js')

const db = level('db')
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressJWT({
  secret: 'secret',  // 簽名的密鑰, 之後要放到 .env
  algorithms: ['HS256'],
}).unless({
  path: [
    '/api/auth/register',
    '/api/auth/activateAccount',
    '/api/auth/login',
    '/api/auth/getResetPasswordToken',
    '/api/auth/resetPassword',
    '/api/auth/verifyResetPasswordToken',
    { url: /^\/image\/.*/, methods: ['GET'] } // 測試用, 暫時先允許
  ]
}))
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(err.status).send({message: err.message});
    return;
  }
  next();
});

app.post('/api/auth/register', async (req, res) => {
  return register({req, res, db})
});

app.post('/api/auth/activateAccount', async (req, res) => {
  return activateAccount({req, res, db})
});

app.post('/api/auth/login', async (req, res) => {
  return login({req, res, db})
});

app.post('/api/auth/getResetPasswordToken', async (req, res) => {
  return getResetPasswordToken({req, res, db})
});

app.post('/api/auth/resetPassword', async (req, res) => {
  return resetPassword({req, res, db})
});

app.post('/api/auth/verifyResetPasswordToken', async (req, res) => {
  return resetPassword({req, res, db})
});

app.get('/api/user/getUserProfile', async (req, res) => {
  return getUserProfile({req, res, db})
});

app.post('/api/user/setUserProfile', async (req, res) => {
  return setUserProfile({req, res, db})
});

app.get('/api/user/getSuggestions', async (req, res) => {
  return getSuggestions({req, res, db})
});

app.post('/api/user/approveSuggestion', async (req, res) => {
  return approveSuggestion({req, res, db})
});

app.post('/api/user/rejectSuggestion', async (req, res) => {
  return rejectSuggestion({req, res, db})
});

app.get('/api/user/getNotifications', async (req, res) => {
  return getNotifications({req, res, db})
});

app.post('/api/user/sendFeedback', async (req, res) => {
  return sendFeedback({req, res, db})
});

app.post('/api/user/modifyPassword', async (req, res) => {
  return modifyPassword({req, res, db})
});

app.use('/image', express.static(__dirname + '/images'));

app.get('*', (req, res) => {
  res.status(404).send()
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
});
