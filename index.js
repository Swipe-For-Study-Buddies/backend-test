const express = require('express')
const cors = require('cors')
const expressJWT = require('express-jwt')
const level = require('level')
const {
  register,
  login,
  getResetPasswordToken,
  resetPassword,
} = require('./auth.js')
const {
  getUserProfile,
  setUserProfile,
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
    '/api/auth/login',
    '/api/auth/getResetPasswordToken',
    '/api/auth/resetPassword',
    '/api/auth/verifyResetPasswordToken',
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

app.get('*', (req, res) => {
  res.status(404).send()
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
});
