import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { client } from "../config/db.js";
import { embeddings } from "../services/embedding.Services.js";

const getVectorStore = () => {
    const collection = client
    .db(process.env.MONGODB_DB)
    .collection(process.env.MONGODB_COLLECTION);

    return new MongoDBAtlasVectorSearch(embeddings, {
        collection: collection,
        indexName: "vector_index", 
        textKey: "text",            
        embeddingKey: "embedding"   
    });
};

const getFileMetaCollection = () => {
    return client.db(process.env.MONGODB_DB).collection("FileMetadata");
};

const getChatHistoryCollection = () => {
    return client.db(process.env.MONGODB_DB).collection("ChatHistory");
};

const addChunk = async (chunk) => {
    const vectorStore = getVectorStore();
    await vectorStore.addDocuments(chunk);
};

const addDocumentMetadata = async (metadata) => {
    const collection = getFileMetaCollection();
    // Use upsert to avoid duplicates if re-uploaded
    await collection.updateOne(
        { fileName: metadata.fileName },
        { $set: metadata },
        { upsert: true }
    );
};

const getAllDocuments = async () => {
    const collection = getFileMetaCollection();
    // Sort by newest first
    return await collection.find({}).sort({ uploadedAt: -1 }).toArray();
};

const getStorageStats = async () => {
    const collection = getFileMetaCollection();
    const result = await collection.aggregate([
        { $group: { _id: null, totalBytes: { $sum: "" } } }
    ]).toArray();
    
    const usedBytes = result.length > 0 ? result[0].totalBytes : 0;
    const limitBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    return { usedBytes, limitBytes };
};

const deleteDocument = async (sourceName) => {
    const vectorCollection = client.db(process.env.MONGODB_DB).collection(process.env.MONGODB_COLLECTION);
    const metaCollection = getFileMetaCollection();

    await vectorCollection.deleteMany({ "metadata.source": sourceName });
    await metaCollection.deleteOne({ fileName: sourceName });
};

// Chat History Methods
const saveChatMessage = async (sessionId, role, content, sources = []) => {
    const collection = getChatHistoryCollection();
    const timestamp = new Date();
    
    const message = { role, content, sources, timestamp };
    
    await collection.updateOne(
        { sessionId },
        { 
            $setOnInsert: { createdAt: timestamp },
            $set: { updatedAt: timestamp },
            $push: { messages: message }
        },
        { upsert: true }
    );
};

const getChatSessions = async () => {
    const collection = getChatHistoryCollection();
    return await collection.find({}, { projection: { messages: { $slice: 1 }, updatedAt: 1, sessionId: 1 } })
                           .sort({ updatedAt: -1 }).toArray();
};

const getChatSessionById = async (sessionId) => {
    const collection = getChatHistoryCollection();
    return await collection.findOne({ sessionId });
};

export { 
    getVectorStore, addChunk, addDocumentMetadata, getAllDocuments, 
    deleteDocument, getStorageStats, saveChatMessage, getChatSessions, 
    getChatSessionById 
};
