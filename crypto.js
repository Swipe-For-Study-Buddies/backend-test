const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = 'secret'.padEnd(32, 'secret')
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return encrypted.toString('hex')
};

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'))
  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()])
  return decrpyted.toString()
};

module.exports = {
  encrypt,
  decrypt
};
