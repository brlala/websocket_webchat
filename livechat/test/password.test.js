const chai = require('chai');
const { hashPassword, verifyPassword } = require('../password');

const { expect, assert } = chai;

describe('validator hashPassword() and verifyPassword()', () => {
  it('Correct password = True', (done) => {
    const password = 'pѬѬasѪ"§§)("!编/)$=?!°&%)?§"$(§sw汉字编码§"$(§sw汉字方法orФdpѬѬasѪ"§§)("!/)$=?!°&%)?编码方法orФd';
    hashPassword(password, (err, hash) => {
      verifyPassword(password, hash, (err1, correct) => {
        expect(correct).to.equal(true);
        done();
      });
    });
  });

  it('Incorrect password = False', (done) => {
    let password = 'pѬѬasѪ"§§)("!编/)$=?!°&%)?§"$(§sw汉字编码§"$(§sw汉字方法orФdpѬѬasѪ"§§)("!/)$=?!°&%)?编码方法orФd';
    hashPassword(password, (err, hash) => {
      password = 'pѬѬasѪ"§§)("!编/)$=?!°&%)?§"$(§sw汉字编码§"$(§sw汉字方法orФdpѬѬasѪ"§§)("!/)$=?!°&%)?编码方法orФe';
      verifyPassword(password, hash, (err1, correct) => {
        expect(correct).to.equal(false);
        done();
      });
    });
  });
});
