import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv"

dotenv.config()


const embedding = new GoogleGenerativeAIEmbeddings({
    modelName: "text-embedding-004"
});

export {embedding};