import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {client, connectDB} from "./config/db.js"
import { errorHandler } from "./middleware/error.Middleware.js";
// yeh env file ko load karti hai 
dotenv.config();

// express ko intilize kiya hai yaha pe 
const app = express();


app.use(cors());
app.use(express.json());


// test route create , server aur mongodb ka test is done here 
app.get("/test", async (req,res)=>{
    try {
        await client.db().admin().ping();
    res.json({
        status: "server running",
        databse:"mongodb running"
    });
        
    } catch (error) {
        res.status(500).json({
            server:"running",
            database:"not running"
        });
    } 
});


const PORT = process.env.PORT || 3000;

app.use(errorHandler);
app.listen(PORT,async ()=>{
    await connectDB();
    console.log(`server is running ${PORT}`)
});
