const chai = require('chai');

const { expect } = chai;
const {
  add, mul, sub, div,
} = require('../../controllers/testController');

describe('validator isNumValid()', () => {
  it('2 + 3 = 5', () => {
    expect(add(2, 3)).to.equal(5);
  });
  it('3 * 4 = 12', () => {
    expect(mul(4, 3)).to.equal(12);
  });
  it('5 - 6 = -1', () => {
    expect(sub(5, 6)).to.equal(-1);
  });
  it('8 / 4 = 2', () => {
    expect(div(8, 4)).to.equal(2);
  });
});

//  validator isNumValid()
//     √ 2 + 3 = 5
//     √ 3 * 4 = 12
//     √ 5 - 6 = -1
//     √ 8 / 4 = 2
//
//
//   4 passing (11ms)
