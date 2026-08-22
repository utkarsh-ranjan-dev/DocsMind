import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { client } from "../config/db.js";
import { embeddings } from "../services/embedding.Services.js";
import crypto from "crypto";

const getVectorStore = () => {
    const collection = client.db(process.env.MONGODB_DB).collection(process.env.MONGODB_COLLECTION);
    return new MongoDBAtlasVectorSearch(embeddings, {
        collection: collection,
        indexName: "vector_index", 
        textKey: "text",            
        embeddingKey: "embedding"   
    });
};

const getFileMetaCollection = () => client.db(process.env.MONGODB_DB).collection("FileMetadata");
const getChatHistoryCollection = () => client.db(process.env.MONGODB_DB).collection("ChatHistory");
const getNotebookCollection = () => client.db(process.env.MONGODB_DB).collection("Notebooks");

// --- NOTEBOOK METHODS ---
const createNotebook = async (name, userId) => {
    const id = crypto.randomUUID();
    const notebook = { id, name, userId, createdAt: new Date() };
    await getNotebookCollection().insertOne(notebook);
    return notebook;
};

const getNotebooks = async (userId) => {
    return await getNotebookCollection().find({ userId }).sort({ createdAt: -1 }).toArray();
};

// --- DOCUMENT METHODS ---
const addChunk = async (chunk) => {
    const vectorStore = getVectorStore();
    await vectorStore.addDocuments(chunk);
};

const addDocumentMetadata = async (metadata) => {
    const collection = getFileMetaCollection();
    await collection.updateOne(
        { fileName: metadata.fileName, notebookId: metadata.notebookId },
        { $set: metadata },
        { upsert: true }
    );
};

const getAllDocuments = async (notebookId, userId) => {
    const collection = getFileMetaCollection();
    const filter = notebookId ? { notebookId, userId } : { userId };
    return await collection.find(filter).sort({ uploadedAt: -1 }).toArray();
};

const getStorageStats = async (userId) => {
    const collection = getFileMetaCollection();
    const result = await collection.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalBytes: { $sum: "$size" } } }
    ]).toArray();
    
    const usedBytes = result.length > 0 ? result[0].totalBytes : 0;
    const limitBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    return { usedBytes, limitBytes };
};

const deleteDocument = async (sourceName, notebookId, userId) => {
    const vectorCollection = client.db(process.env.MONGODB_DB).collection(process.env.MONGODB_COLLECTION);
    const metaCollection = getFileMetaCollection();

    await vectorCollection.deleteMany({ "metadata.source": sourceName, notebookId, userId });
    await metaCollection.deleteOne({ fileName: sourceName, notebookId, userId });
};

// --- CHAT HISTORY METHODS ---
const saveChatMessage = async (sessionId, notebookId, role, content, sources = [], userId) => {
    const collection = getChatHistoryCollection();
    const timestamp = new Date();
    const message = { role, content, sources, timestamp };
    
    await collection.updateOne(
        { sessionId, userId },
        { 
            $setOnInsert: { createdAt: timestamp, notebookId, userId },
            $set: { updatedAt: timestamp },
            $push: { messages: message }
        },
        { upsert: true }
    );
};

const getChatSessions = async (notebookId, userId) => {
    const collection = getChatHistoryCollection();
    const filter = notebookId ? { notebookId, userId } : { userId };
    return await collection.find(filter, { projection: { messages: { $slice: 1 }, updatedAt: 1, sessionId: 1, notebookId: 1 } })
                           .sort({ updatedAt: -1 }).toArray();
};

const getChatSessionById = async (sessionId, userId) => {
    const collection = getChatHistoryCollection();
    return await collection.findOne({ sessionId, userId });
};

export { 
    getVectorStore, addChunk, addDocumentMetadata, getAllDocuments, 
    deleteDocument, getStorageStats, saveChatMessage, getChatSessions, 
    getChatSessionById, createNotebook, getNotebooks
};
