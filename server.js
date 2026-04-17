import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import path from "path";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import friendRoutes from "./routes/friends.js";
import messageRoutes from "./routes/message.js";
import chatRoutes from "./routes/chat.js";
import accauntRoutes from "./routes/accaunt.js";


dotenv.config();

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(hpp());

app.use(cors({
    origin: [
        "https://chat-app-frontend-1-1.vercel.app", 
        "http://localhost:5173"                     
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json({ limit: "10kb" }));
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj instanceof Object) {
            for (let key in obj) {
                if (key.startsWith('$') || key.includes('.')) {
                    const newKey = key.replace(/\$|\./g, '_');
                    obj[newKey] = obj[key];
                    delete obj[key];
                    sanitize(obj[newKey]);
                } else {
                    sanitize(obj[key]);
                }
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    if (req.query) sanitize(req.query);
    
    next();
});

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


export const attachIO = (io) => (req, res, next) => {
    req.io = io;
    next();
};


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/accaunt", accauntRoutes);



app.get("/", (req, res) => {
    res.send("API Radi.");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: "Something went wrong on the server!",
        error: process.env.NODE_ENV === "development" ? err.message : {} 
    });
});

export default app;


