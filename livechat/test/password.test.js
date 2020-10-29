const chai = require('chai');
const { hashPassword, verifyPassword } = require('../password');

const { expect, assert } = chai;

const config = {
  hashBytes: 32,
  saltBytes: 16,
  digest: 'sha512',
  iterations: 150000,
};
describe('passwordManager', () => {
  it('password encryption and decryption flow', (done) => {
    const password = 'pѬѬasѪ"§§)("!编/)$=?!°&%)?§"$(§sw汉字编码§"$(§sw汉字方法orФdpѬѬasѪ"§§)("!/)$=?!°&%)?编码方法orФd';
    hashPassword(password, (err, hash) => {
      verifyPassword(password, hash, (err1, correct) => {
        expect(correct).to.equal(true);
        done();
      });
    });
  });
});
