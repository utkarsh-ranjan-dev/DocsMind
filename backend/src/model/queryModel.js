import { getVectorStore } from "./documentModel.js";


const similarSearchChunk= async (question,k=5)=>{
const vectorStore = getVectorStore();
// FIX: Added "await" - similaritySearch is async, without await it returns a Promise object instead of results!
const results = await vectorStore.similaritySearch(question,k);
return results;
};


export {similarSearchChunk}