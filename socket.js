import { Server } from "socket.io";
import Message from "./models/Message.js";

export const initSocket = (server) => {

const io = new Server(server, {
    cors: {
        origin: [
                "https://chat-app-frontend-1-1.vercel.app", 
                "http://localhost:5173"
            ],
        methods: ["GET", "POST"]
    }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    socket.on("setup", (userId) => {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.join(userId);

        io.emit("online users", Array.from(onlineUsers.keys()));
        });

        socket.on("disconnect", () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
        }

        io.emit("online users", Array.from(onlineUsers.keys()));
    });

    socket.on("join chat", (chatId) => {
        socket.join(chatId);
        console.log("Joinded Chat:", chatId);
    });

    socket.on("leave chat", (chatId) => {
        socket.leave(chatId);
    });

    socket.on("typing", (chatId) => {
        socket.to(chatId).emit("typing")
    });

    socket.on("stop typing", (chatId) => {
        socket.to(chatId).emit("stop typing")
    });

    socket.on("new message", (message) => {
        const chatId = message.chat;
        socket.to(chatId).emit("message received", message);
    });

    socket.on("message delivered", async ({ messageId, userId }) => {
        await Message.findByIdAndUpdate(messageId, {
        $addToSet: { deliveredTo: userId }
    })

        socket.emit("message delivered", { messageId, userId })
    });

    socket.on("messages seen", async ({ chatId, userId }) => {
        await Message.updateMany(
            { chat: chatId, 
             seenBy: { $ne: userId }   
            },
            {
                $addToSet: { seenBy: userId }
            }
        );

        socket.to(chatId).emit("messages seen", { chatId, userId })
    });

    socket.on("disconnect", () => {
        console.log("User disconnected.");

        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId)
                break;
            }
        }
        io.emit("online users", Array.from(onlineUsers.keys()))
    });


});
    return io;

}