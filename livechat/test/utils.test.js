const chai = require('chai');
const { formatMessage, formatOutgoingMessage } = require('../utils');

const { expect } = chai;

describe('validator formatMessage()', () => {
  it('widget -> gateway -> livechat (message)', async () => {
    const incoming = {
      session_id: '5f96287c782d01bc8c4c142c',
      receiver_platform_id: 'admin@email.com',
      type: 'message',
      data: { text: 'user' },
      abbr: 'livechatdev',
      platform: 'widget',
      handler: 'livechat',
      _id: '5f9a92ba5f0a75582ba3d18f',
      username: '5f96287c782d01bc8c4c142c',
      roomTitle: '5f96287c782d01bc8c4c142c',
    };
    const result = await formatMessage(incoming, 'agent');
    expect(result).to.include.all.keys('time', 'username', 'sender_platform_id', 'type', 'handler', 'session_id', 'roomTitle', 'platform', 'data', 'abbr');
    expect(result).to.have.nested.property('data.text');
    expect(result.username).to.equal('5f96287c782d01bc8c4c142c');
    expect(result.sender_platform_id).to.equal('5f96287c782d01bc8c4c142c');
    expect(result.roomTitle).to.equal('5f96287c782d01bc8c4c142c');
    expect(result.platform).to.equal('widget');
    expect(result.handler).to.equal('agent');
  });

  it('livechat -> gateway -> widget (message)', async () => {
    const incoming = {
      username: 'admin@email.com',
      type: 'message',
      data: { text: 'hi' },
      roomTitle: '5f96287c782d01bc8c4c142c',
      id: '5f7ec401f27c831ad1ff083d',
      platform: 'widget',
      userReference: '5f96287c782d01bc8c4c142c',
    };
    const result = await formatMessage(incoming, 'user');
    expect(result).to.include.all.keys('time', 'username', 'sender_platform_id', 'type', 'handler', 'session_id', 'roomTitle', 'platform', 'data', 'abbr');
    expect(result).to.have.nested.property('data.text');
    expect(result.username).to.equal('admin@email.com');
    expect(result.sender_platform_id).to.equal('admin@email.com');
    expect(result.roomTitle).to.equal('5f96287c782d01bc8c4c142c');
    expect(result.session_id).to.equal('5f96287c782d01bc8c4c142c');
    expect(result.platform).to.equal('widget');
    expect(result.handler).to.equal('user');
  });

  it('facebook -> gateway -> livechat (message)', async () => {
    const incoming = {
      sender_platform_id: '3436374243056091',
      receiver_platform_id: 'admin@email.com',
      type: 'message',
      data: {
        text: 'fb user',
        mid: 'm_1O91W6TZohUNWuLLmoaNv1PibCYXnk7jZs9o4UFh3zldIQwVYYKIoQ-tKvQ3QxqletkUkwTJI2Zjs2zDT2civw',
      },
      abbr: 'livechatdev',
      platform: 'facebook',
      handler: 'livechat',
      _id: '5f9a94605f0a75582ba3d194',
      username: '3436374243056091',
      roomTitle: '5f71b277879869c492b13353',
    };

    const result = await formatMessage(incoming, 'agent');
    expect(result).to.include.all.keys('time', 'username', 'sender_platform_id', 'type', 'handler', 'receiver_platform_id', 'roomTitle', 'platform', 'data', 'abbr');
    expect(result).to.have.nested.property('data.text');
    expect(result.username).to.equal('3436374243056091');
    expect(result.sender_platform_id).to.equal('3436374243056091');
    expect(result.roomTitle).to.equal('5f71b277879869c492b13353');
    expect(result.platform).to.equal('facebook');
    expect(result.handler).to.equal('agent');
  });

  it('livechat -> gateway -> facebook (message)', async () => {
    const incoming = {
      username: 'admin@email.com',
      type: 'message',
      data: { text: 'lc user' },
      roomTitle: '5f71b277879869c492b13353',
      id: '5f7ec401f27c831ad1ff083d',
      platform: 'facebook',
      userReference: '3436374243056091',
    };

    const result = await formatMessage(incoming, 'agent');
    expect(result).to.include.all.keys('time', 'username', 'sender_platform_id', 'type', 'handler', 'receiver_platform_id', 'roomTitle', 'platform', 'data', 'abbr');
    expect(result).to.have.nested.property('data.text');
    expect(result.username).to.equal('admin@email.com');
    expect(result.sender_platform_id).to.equal('admin@email.com');
    expect(result.receiver_platform_id).to.equal('3436374243056091');
    expect(result.roomTitle).to.equal('5f71b277879869c492b13353');
    expect(result.platform).to.equal('facebook');
    expect(result.handler).to.equal('agent');
  });

  it('facebook -> gateway -> livechat (not supported)', async () => {
    const incoming = {
      sender_platform_id: '3436374243056091',
      receiver_platform_id: 'admin@email.com',
      type: 'sticker',
      data: {
        sticker_id: 201013663381901,
        mid: 'm_EdeY2r9voU9NXoOp0Lu3yVPibCYXnk7jZs9o4UFh3zlZrkdV-a6LP1VWXvIumX7PUPkOa23vjheK8a90SWT0zg',
      },
      abbr: 'livechatdev',
      platform: 'facebook',
      handler: 'livechat',
      _id: '5f9a966c5f0a75582ba3d197',
      username: '3436374243056091',
      roomTitle: '5f71b277879869c492b13353',
    };

    const result = await formatMessage(incoming, 'agent');
    expect(result).to.include.all.keys('time', 'username', 'sender_platform_id', 'type', 'handler', 'receiver_platform_id', 'roomTitle', 'platform', 'data', 'abbr');
    expect(result.data).to.deep.equal({});
    expect(result.username).to.equal('3436374243056091');
    expect(result.sender_platform_id).to.equal('3436374243056091');
    expect(result.roomTitle).to.equal('5f71b277879869c492b13353');
    expect(result.platform).to.equal('facebook');
    expect(result.type).to.equal('sticker');
    expect(result.handler).to.equal('agent');
  });
});

describe('validator formatOutgoingMessage()', () => {
  it('formatting images to CMF format', async () => {
    const incoming = {
      session_id: '5f96287c782d01bc8c4c142c',
      receiver_platform_id: 'admin@email.com',
      type: 'images',
      data: { urls: [{ url: 'www.test.com' }] },
      abbr: 'livechatdev',
      platform: 'widget',
      handler: 'livechat',
      _id: '5f9a92ba5f0a75582ba3d18f',
      username: '5f96287c782d01bc8c4c142c',
      roomTitle: '5f96287c782d01bc8c4c142c',
    };
    const result = formatOutgoingMessage(incoming);
    expect(result.type).to.equal('image');
    expect(result).to.have.nested.property('data.url');
    expect(result.data.url).to.equal('www.test.com');
  });

  it('formatting files to CMF format', async () => {
    const incoming = {
      session_id: '5f96287c782d01bc8c4c142c',
      receiver_platform_id: 'admin@email.com',
      type: 'files',
      data: { urls: [{ url: 'www.test.com' }] },
      abbr: 'livechatdev',
      platform: 'widget',
      handler: 'livechat',
      _id: '5f9a92ba5f0a75582ba3d18f',
      username: '5f96287c782d01bc8c4c142c',
      roomTitle: '5f96287c782d01bc8c4c142c',
    };
    const result = formatOutgoingMessage(incoming);
    expect(result.type).to.equal('image');
    expect(result).to.have.nested.property('data.url');
    expect(result.data.url).to.equal('www.test.com');
  });
});
