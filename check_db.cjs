
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const docs = await db.collection(process.env.MONGODB_COLLECTION).find({}).toArray();
    console.log('Total chunks in Vector DB:', docs.length);
    if (docs.length > 0) {
      console.log('Sample chunk metadata:', docs[docs.length - 1].metadata);
    }
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run();

