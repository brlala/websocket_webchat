const crypto = require('crypto');

// larger numbers mean better security, less
const config = {
  // size of the generated hash
  hashBytes: 32,
  // larger salt means hashed passwords are more resistant to rainbow table, but
  // you get diminishing returns pretty fast
  saltBytes: 16,
  // A selected HMAC digest algorithm specified by digest is applied to derive
  // a key of the requested byte length (keylen) from the password, salt and
  // iterations.
  // - sha512, sha256
  // - whirlpool
  // and more.
  digest: 'sha512',
  // more iterations means an attacker has to take longer to brute force an
  // individual password, so larger is better. however, larger also means longer
  // to hash the password. tune so that hashing the password takes about a
  // second
  iterations: 150000,
};

// Example user with a hashed value, comment to the right contains the password string
const users = {
  hans: '00000010000249f0f7d48ee0957333c66bcc2721ac9cb72157cdf127698fcdf56243656acdb1e93fa664d504a4892fe669c64f199a936fc6', // 'pѬѬasѪ"§§)("!编/)$=?!°&%)?§"$(§sw汉字编码§"$(§sw汉字方法orФdpѬѬasѪ"§§)("!/)$=?!°&%)?编码方法orФd'
};

/**
 * Hash a password using Node's asynchronous pbkdf2 (key derivation) function.
 *
 * Returns a self-contained buffer which can be arbitrarily encoded for storage
 * that contains all the data needed to verify a password.
 *
 * @param {!String} password
 * @param {!function(?Error, ?Buffer=)} callback
 */
function hashPassword(password, callback) {
  // generate a salt for pbkdf2
  crypto.randomBytes(config.saltBytes, (err, salt) => {
    if (err) {
      return callback(err);
    }

    crypto.pbkdf2(password, salt, config.iterations, config.hashBytes, config.digest, (err, hash) => {
      if (err) {
        return callback(err);
      }

      let combined = Buffer.alloc(hash.length + salt.length + 8);

      // include the size of the salt so that we can, during verification,
      // figure out how much of the hash is salt
      combined.writeUInt32BE(salt.length, 0, true);
      // similarly, include the iteration count
      combined.writeUInt32BE(config.iterations, 4, true);

      salt.copy(combined, 8);
      hash.copy(combined, salt.length + 8);
      callback(null, combined);
    });
  });
}

/**
 * Verify a password using Node's asynchronous pbkdf2 (key derivation) function.
 *
 * Accepts a hash and salt generated by hashPassword, and returns whether the
 * hash matched the password (as a boolean).
 *
 * @param {!String} password
 * @param {!String} combined Buffer containing hash and salt as generated by
 *   hashPassword.
 * @param {!function(?Error, !boolean)}
 */
function verifyPassword(password, combined, callback) {
  let buffer = Buffer.from(combined, 'hex');

  // extract the salt and hash from the combined buffer
  let saltBytes = buffer.readUInt32BE(0);
  let hashBytes = buffer.length - saltBytes - 8;
  let iterations = buffer.readUInt32BE(4);
  let salt = buffer.slice(8, saltBytes + 8);
  let hash = buffer.toString('binary', saltBytes + 8);
  let { digest } = config;

  // verify the salt and hash against the password
  crypto.pbkdf2(password, salt, iterations, hashBytes, digest, (err, verify) => {
    if (err) {
      return callback(err, false);
    }

    callback(null, verify.toString('binary') === hash);
  });
}

exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;

// hashPassword('pѬѬasѪ"§§)("!编/)$=?!°&%)?§"$(§sw汉字编码§"$(§sw汉字方法orФdpѬѬasѪ"§§)("!/)$=?!°&%)?编码方法orФd', (err, hash) => {
//   if (err) {
//     return 1;
//   }
//   // example hash that can be used to validate the password
//   console.log(hash.toString('hex'));
// });
//
// verifyPassword('pѬѬasѪ"§§)("!编/)$=?!°&%)?§"$(§sw汉字编码§"$(§sw汉字方法orФdpѬѬasѪ"§§)("!/)$=?!°&%)?编码方法orФd', users.hans.toString(), (err, correct) => {
//   if (err) {
//     return 1;
//   }
//   console.log(correct);
// });
