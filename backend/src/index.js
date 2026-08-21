import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, client } from "./config/db.js"
import { errorHandler } from "./middleware/error.Middleware.js";
import documentRoutes from "./routes/documents.Routes.js"
import queryRoutes from "./routes/query.Routes.js"

// dotenv loaded once here (db.js also loads it, that's fine - second call is a no-op)
dotenv.config({ path: './backend/.env' });

const app = express();

app.use(cors());
app.use(express.json());

// test route
app.get("/test", async (req,res)=>{
    try {
        await client.db().admin().ping();
        res.json({
            status: "server running",
            database:"mongodb running"
        });
    } catch (error) {
        res.status(500).json({
            server:"running",
            database:"not running"
        });
    }
});

app.use("/api/documents", documentRoutes)
app.use("/api/query", queryRoutes)

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// FIX: connectDB BEFORE app.listen so DB is ready before accepting requests
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`server is running ${PORT}`)
    });
};

startServer();
