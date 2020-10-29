const chai = require('chai');
const { escapeRegExp, formatEmailWithValue } = require('../../controllers/userController');

const { expect } = chai;

describe('validator escapeRegExp()', () => {
  it('testing1@email.com', () => {
    expect(escapeRegExp('testing1@email.com')).to.equal('testing1@email\\.com');
  });

  it('test.ing2@email.com', () => {
    expect(escapeRegExp('test.ing2@email.com')).to.equal('test\\.ing2@email\\.com');
  });

  it('test_ing3@email.com', () => {
    expect(escapeRegExp('test_ing3@email.com')).to.equal('test_ing3@email\\.com');
  });
});

describe('validator formatEmailWithValue()', () => {
  it('replacing all handlebar', () => {
    const data = 'width="100%" Manager, {{csmName}} ({{csmEmail}}) {{homeUrl}}';
    let replacements = {
      csmName: 'admin',
      csmEmail: 'admin@email.com',
      homeUrl: 'www.localhost.com',
    };
    expect(formatEmailWithValue(data, replacements)).to.equal('width="100%" Manager, admin (admin@email.com) www.localhost.com');
  });

  it('replacing handlebars with typo', () => {
    const data = 'width="100%" Manager, {{csmName}} ({{csmEmail}}) {{homeUrl}}';
    let replacements = {
      csmName: 'admin',
      csmaEmail: 'admin@email.com',
      homeUrl: 'www.localhost.com',
    };
    expect(formatEmailWithValue(data, replacements)).to.equal('width="100%" Manager, admin () www.localhost.com');
  });

  it('replacing handlebars with different types', () => {
    const data = 'width="100%" Manager, {{csmName}} ({{csmEmail}}) {{homeUrl}}';
    let replacements = {
      csmName: 'admin',
      csmEmail: 'admin@email.com',
      homeUrl: 2147483647,
    };
    expect(formatEmailWithValue(data, replacements)).to.equal('width="100%" Manager, admin (admin@email.com) 2147483647');
  });
});
