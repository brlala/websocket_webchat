const { MongoClient, ObjectID } = require('mongodb');
const fs = require('fs');
require('dotenv').config();
// Replace the uri string with your MongoDB deployment's connection string.
const options = { useUnifiedTopology: true };
const mongoUrl = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}:${process.env.DB_PORT}/${process.env.DB_AUTH_DATABASE}`;
console.log(mongoUrl);

const client = new MongoClient(mongoUrl, options);

async function addCannedResponses(database) {
  const collection = database.collection('livechat_canned_response');
  // create a document to be inserted
  const obj = JSON.parse(fs.readFileSync('setup/livechatCannedResponses.json', 'utf8'));
  for (let i = 0; i < obj.responses.length; i++) {
    let doc = { ...obj.responses[i] };
    doc._id = ObjectID(obj.responses[i]._id);
    doc.user = ObjectID(obj.responses[i].user);
    doc.created_at = new Date();
    doc.updated_at = new Date();
    const result = await collection.replaceOne({ _id: doc._id }, doc, { upsert: true });

    console.log(
      `CannedResponses [${doc.name}] inserted with the _id: ${doc._id}`,
    );
  }
}

async function addAccessControl(database) {
  const collection = database.collection('livechat_access_control');
  // create a document to be inserted
  const obj = JSON.parse(fs.readFileSync('setup/livechatAccessControl.json', 'utf8'));
  for (let i = 0; i < obj.responses.length; i++) {
    let doc = { ...obj.responses[i] };
    doc._id = new ObjectID(obj.responses[i]._id);
    const result = await collection.replaceOne({ _id: doc._id }, doc, { upsert: true });

    console.log(
      `AccessControl [${doc.name}] inserted with the _id: ${doc._id}`,
    );
  }
}

async function addAgentGroup(database) {
  const collection = database.collection('livechat_agent_group');
  // create a document to be inserted
  const livechatAccessObj = JSON.parse(fs.readFileSync('setup/livechatAccessControl.json', 'utf8'));
  let accessArray = [];
  for (let i = 0; i < livechatAccessObj.responses.length; i++) {
    accessArray.push(ObjectID(livechatAccessObj.responses[i]._id));
  }

  const obj = JSON.parse(fs.readFileSync('setup/livechatAgentGroup.json', 'utf8'));
  for (let i = 0; i < obj.responses.length; i++) {
    let doc = { ...obj.responses[i] };
    doc._id = new ObjectID(obj.responses[i]._id);
    doc.access_control_ids = accessArray;
    doc.created_at = new Date();
    doc.updated_at = new Date();
    const result = await collection.replaceOne({ _id: doc._id }, doc, { upsert: true });

    console.log(
      `AgentGroup [${doc.name}] inserted with the _id: ${doc._id}`,
    );
  }
}

async function addDefaultUser(database) {
  const collection = database.collection('livechat_agent');

  // getting default group
  const groupObj = JSON.parse(fs.readFileSync('setup/livechatAgentGroup.json', 'utf8'));
  let defaultGroupId;
  for (let i = 0; i < groupObj.responses.length; i++) {
    let doc = { ...groupObj.responses[i] };
    if (doc.name === 'default') {
      defaultGroupId = doc._id;
      break;
    }
  }
  console.log({ defaultGroupId })
  // create a document to be inserted
  const obj = JSON.parse(fs.readFileSync('setup/livechatUser.json', 'utf8'));
  for (let i = 0; i < obj.responses.length; i++) {
    let doc = { ...obj.responses[i] };
    doc._id = new ObjectID(obj.responses[i]._id);
    doc.created_at = new Date();
    doc.updated_at = new Date();
    doc.livechat_agent_group_id = new ObjectID(defaultGroupId);
    const result = await collection.replaceOne({ _id: doc._id }, doc, { upsert: true });

    console.log(
      `DefaultUser [${doc.email}] inserted with the _id: ${doc._id}`,
    );
  }
}

async function run() {
  try {
    await client.connect();

    const database = client.db(process.env.DB_DATABASE);
    await addCannedResponses(database);
    await addAccessControl(database);
    await addAgentGroup(database);
    await addDefaultUser(database);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
