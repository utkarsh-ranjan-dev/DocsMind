import { getVectorStore } from "./documentModel.js";


const similarSearchChunk= async (question,k=5)=>{
const vectorStore = getVectorStore();
const results = vectorStore.similaritySearch(question,k);
return results;
};


export {similarSearchChunk}