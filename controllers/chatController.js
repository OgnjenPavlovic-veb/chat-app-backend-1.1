import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import rateLimit from 'express-rate-limit';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

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
    const { before, limit = 20 } = req.query;
    
    const chatChech = await Chat.findOne({ _id: chatId, users: req.userId });
       
    
    if (!chatChech) {
        return res.status(403).json({ message: "Access denied. You are not a participant in this chat."});
    }

    if (!chatId) return res.status(400).json({ message: "chatId is required."})

    try {
        const query = { chat: chatId };

        if (before) {
        query.$or = [
            { createdAt: { $lt: new Date(before) } },
            {
            createdAt: new Date(before),
            _id: { $lt: req.query.lastId || null }
            }
        ];
        }

        const messages = await Message.find(query)
        .populate("sender", "username profile.image")
        .sort({ createdAt: -1, _id: -1 })
        .limit(Number(limit));
 
        res.json(messages.reverse());

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const sendMessage = async (req, res) => {
    // should send message.
    const { content, chatId, text } = req.body || {};

    try {
        if (!chatId) return res.status(400).json({ message: "chatId missing. "});

        const cleanContent = content ? DOMPurify.sanitize(content) : "";
        const cleanText = text ? DOMPurify.sanitize(text) : "";

        const messageChach = await Chat.findOne({ _id: chatId, users: req.userId });
    
       if (!messageChach) {
          return res.status(403).json({ message: "Access denied. You are not a participant in this chat."});
       }

        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => file.path);
        }

        const message = await Message.create({
            sender: req.userId,
            chat: chatId,
            content: cleanContent,
            text: cleanText,
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
        const chat = await Chat.findOne({ _id: req.params.id, users: req.userId })
        .populate("users", "username profile.image")
        .populate("admin", "username");

        if (!chat) {
            return res.status(404).json({ message: "Chat not found." });
        }
       
        res.json(chat);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    try {
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found. "});
        }

        if (message.sender.toString() !== req.userId) {
            return res.status(403).json({ message: "You can only delete your own messages." });
        }

        const chatId = message.chat;

        await Message.findByIdAndDelete(messageId);

        const lastMessageInChat = await Message.findOne({ chat: chatId }).sort({ createdAt: -1 });
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: lastMessageInChat ? lastMessageInChat._id : null
        });

        res.json({ message: "Message deleted successfully", chatId, messageId });

    } catch (err) {
        console.error("Delete Message Error.", err);
        res.status(500).json({ message: "Server error. "});
    }  
}

export const editMessage = async (req, res) => {
    
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found." });
        }
  
        if (message.sender.toString() !== req.userId) {
            return res.status(403).json({ message: "Can only edit your own messages." });
        }

        message.text = text;
        message.isEdited = true;
        await message.save();

        const fullMessage = await Message.findById(message._id)
            .populate("sender", "username profile.image")

        res.json(fullMessage);
    } catch (err) {
        console.error("Edit message error", err);
        res.status(500).json({ message: "Server error" });
    }
}

export const messageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 40,
    message: { message: "Too many messages, please wait a minute." },
    standardHeaders: true,
    legacyHeaders: false,
});