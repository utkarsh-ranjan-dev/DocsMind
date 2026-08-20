import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { client } from "../config/db.js";
import { embeddings } from "../services/embeddingService.js";

const getVectorStore=()=>{
    const collection= client
    .db(process.env.MONGODB_DB)
    .collection(process.env.MONGODB_COLLECTION);

    return new MongoDBAtlasVectorSearch(embeddings,{
        collection:collection,
        indexName: vector_index,
        textkey:"text",
        embeddingKey:embedding
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

    const uniqueFile= await collection.distinct("metadata.source");
    return uniqueFile;
};


const deleteDocument = async ()=>{
    const collection = client
    .db(process.env.MONGODB_DB)
    .collection(process.env.MONGODB_COLLECTION)

    await collection.deleteMany({"metadata.source": sourceName})
};

export {getVectorStore,addChunk,getAllDocuments,deleteDocument}