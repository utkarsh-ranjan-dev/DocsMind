import {MongoClient} from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: './backend/.env' });

let client = null;

const connectDB = async ()=>{
    try {
        const uri = process.env.MONGODB_URI;

        if(!uri){
            throw new Error("MONGODB_URI nahi mila .env file me!");
        }

        client = new MongoClient(uri);
        await client.connect();
        console.log("mongodb kaam kar raha hai ");
        
    } catch (error) {
        console.log("mongodb kaam nahi kar raha hai:", error.message);
        process.exit(1);
    }
}

export {client, connectDB};
