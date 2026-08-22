
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const docs = await db.collection(process.env.MONGODB_COLLECTION).find({}).limit(3).toArray();
    console.log(JSON.stringify(docs.map(d => ({ _id: d._id, meta: d.metadata, keys: Object.keys(d) })), null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run();

