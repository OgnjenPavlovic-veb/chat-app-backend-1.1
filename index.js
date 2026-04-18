import 'dotenv/config';
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import app from "./server.js";
import { initSocket } from "./socket.js";
import { attachIO } from "./server.js"
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 5000;

const MONGO_URI = process.env.NODE_ENV === "test" ? process.env.MONGO_TEST_URI : process.env.MONGO_URI;


const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected");

        const server = http.createServer(app);

        if (process.env.NODE_ENV !== "test") {
            const io = initSocket(server);

            app.use(attachIO(io));

            server.listen(PORT, () => {
                console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
            });
        }
    
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

startServer();