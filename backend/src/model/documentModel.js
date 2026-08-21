import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { client } from "../config/db.js";
// FIX: Changed "embeddingService.js" to "embedding.Services.js" to match your naming scheme
import { embeddings } from "../services/embedding.Services.js";

const getVectorStore=()=>{
    const collection= client
    .db(process.env.MONGODB_DB)
    .collection(process.env.MONGODB_COLLECTION);

    return new MongoDBAtlasVectorSearch(embeddings,{
        collection:collection,
        indexName: "vector_index", // FIX: Added quotes - it's a string, not a variable
        textKey:"text",            // FIX: Changed "textkey" to "textKey" (LangChain requires capital K)
        embeddingKey:"embedding"   // FIX: Added quotes - it's a string, not a variable
    });
};


const addChunk = async (chunk)=>{
    const vectorStore= getVectorStore()
    await vectorStore.addDocuments(chunk);
};

const getAllDocuments = async ()=>{
    const collection = client
    .db(process.env.MONGODB_DB)
    .collection(process.env.MONGODB_COLLECTION);

    // LangChain natively stores this inside the 'metadata' object in MongoDB
    const uniqueFile= await collection.distinct("metadata.source");
    return uniqueFile;
};

const deleteDocument = async (sourceName)=>{
    const collection = client
    .db(process.env.MONGODB_DB)
    .collection(process.env.MONGODB_COLLECTION)

    // LangChain natively stores this inside the 'metadata' object in MongoDB
    await collection.deleteMany({"metadata.source": sourceName})
};

export {getVectorStore,addChunk,getAllDocuments,deleteDocument}
