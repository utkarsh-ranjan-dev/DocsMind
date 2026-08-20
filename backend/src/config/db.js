import {MongoClient} from "mongodb";
import dotenv from "dotenv";

dotenv.config();


const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

const connectDB= async ()=>{
    try {
        await client.connect();
        console.log("mongodb kaam kar raha hai ");
        
    } catch (error) {
        console.log("mongodb kaam nahi kar raha hai")
        process.exit(1);
        
    }
}
export {client, connectDB};