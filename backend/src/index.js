import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, client } from "./config/db.js"
import { errorHandler } from "./middleware/error.Middleware.js";
import documentRoutes from "./routes/documents.Routes.js"
import queryRoutes from "./routes/query.Routes.js";
import insightsRoutes from "./routes/insights.Routes.js";
import notebookRoutes from "./routes/notebook.Routes.js";
import publicRoutes from "./routes/public.Routes.js";
import { clerkMiddleware } from '@clerk/express';
import { requireJsonAuth } from './middleware/auth.Middleware.js';

// dotenv loaded once here
dotenv.config({ path: './.env' }); // Adjusted since it runs in backend dir via nodemon usually, though keeping it safe

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,                   // Set in Render env vars
  'https://frontend-tau-plum-63.vercel.app',   // Your Vercel app
  'http://localhost:5173',                      // Local Vite dev server
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    // Also allow any *.vercel.app subdomain as a safety net
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.error(`BACKEND ERROR: Error: CORS blocked: ${origin}`);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(clerkMiddleware()); // Injects req.auth

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

// Protect all /api routes with requireJsonAuth
app.use("/api/documents", requireJsonAuth, documentRoutes)
app.use("/api/query", requireJsonAuth, queryRoutes);
app.use("/api/insights", requireJsonAuth, insightsRoutes);
app.use("/api/notebooks", requireJsonAuth, notebookRoutes);
app.use("/api/public", publicRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`server is running ${PORT}`)
    });
};

startServer();


