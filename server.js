import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import friendRoutes from "./routes/friends.js";
import messageRoutes from "./routes/message.js";
import chatRoutes from "./routes/chat.js";
import accauntRoutes from "./routes/accaunt.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

export const attachIO = (io) => (req, res, next) => {
    req.io = io;
    next();
};


app.use("/api/auth/", authRoutes);
app.use("/api/users/", userRoutes);
app.use("/api/friends/", friendRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/accaunt", accauntRoutes);



app.get("/", (req, res) => {
    res.send("API Radi.");
});

export default app;


