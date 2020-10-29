const chai = require('chai');
const { formatIpAddress } = require('../networking');

const { expect } = chai;

describe('formatIpAddress()', () => {
  it('172.2.0.0 -> 172-2-0-0', () => {
    expect(formatIpAddress('172.2.0.0')).to.equal('172-2-0-0');
  });
});
