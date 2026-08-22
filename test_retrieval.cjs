
const { MongoDBAtlasVectorSearch } = require('@langchain/mongodb');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const collection = client.db(process.env.MONGODB_DB).collection(process.env.MONGODB_COLLECTION);
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: 'gemini-embedding-2',
        apiKey: process.env.GOOGLE_API_KEY
    });
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection: collection,
        indexName: 'vector_index',
        textKey: 'text',
        embeddingKey: 'embedding'
    });
    // Test WITH the filter exactly as it is in query.Controller.js
    const filter = { preFilter: { notebookId: { $eq: '44101da3-ed68-448e-9672-fb50a26f44ef' } } };
    const results = await vectorStore.similaritySearch('disaster', 2, filter);
    console.log(JSON.stringify(results, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run();

