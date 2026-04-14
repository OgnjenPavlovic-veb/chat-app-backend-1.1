import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

export const accessChat = async (req, res) => {
  
  // should return existing chat.
    const { userId } = req.body;

    try {
        let chat = await Chat.findOne({
            isGroup: false,
            users: { $all: [req.userId, userId] }
        }).populate("users", "username profile.image")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "username"
            }
        });

        if (chat) {
            return res.json(chat);
        }
  // should create new chat if not exists.
        const newChat = await Chat.create({
            users: [req.userId, userId]
        });

        const fullChat = await Chat.findById(newChat._id).populate("users", "username profile.image");

        res.json(fullChat);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}


export const getMessages = async (req, res) => {
    // should return messages.
    const { chatId } = req.params;

    if (!chatId) return res.status(400).json({ message: "chatId is required."})

    try {
        const messages = await Message.find({
            chat: chatId
        }).populate("sender", "username profile.image")
        .sort({ createdAt: 1 });

        res.json(messages);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const sendMessage = async (req, res) => {
    // should send message.
    const { chatId, text } = req.body || {};

    try {

        if (!chatId) return res.status(400).json({ message: "chatId missing. "});

        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => 
            `http://localhost:5000/uploads/${file.filename}`
            );
        }

        const message = await Message.create({
            sender: req.userId,
            chat: chatId,
            text,
            images: imageUrls,
            deliveredTo: [req.userId],
            seenBy: [req.userId]
        });

        const fullMessage = await Message.findById(message._id)
        .populate("sender", "username profile.image");

        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id
        });

        res.json(fullMessage);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const getSingleChat = async (req, res) => {
    // should return singleChat.
    try {
        const chat = await Chat.findById(req.params.id)
        .populate("users", "username profile.image")
        .populate("admin", "username");
       
        res.json(chat);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}