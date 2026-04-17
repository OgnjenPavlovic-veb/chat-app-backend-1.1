import GroupRequest from "../models/GroupRequest.js";
import Chat from "../models/Chat.js";
import { json } from "express";
import User from "../models/User.js";


export const createGroupChat = async (req, res) => {
    try {
        const { name } = req.body;

        const image = req.file ? req.file.filename : "";

        const chat = await Chat.create({
            isGroup: true,
            name,
            users: [req.userId],
            admin: req.userId,
            groupImage: image
        });

        const fullChat = await Chat.findById(chat._id)
        .populate("users", "username profile.image")

        res.json(fullChat);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const createGroupRequest = async (req, res) => {
    try {
        const { name, users } = req.body;

        const parsedUsers = JSON.parse(users)

        const image = req.file ? req.file.filename : "";

        const request = await GroupRequest.create({
            groupName: name,
            groupImage: image,
            sender: req.userId,
            receivers: parsedUsers
        });

        res.json({ request ,message: "Group request send." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const acceptGroupRequest = async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await GroupRequest.findById(requestId);

        if (!request) return res.status(404).json({ message: "Request is not found." });

        const chat = await Chat.create({
            isGroup: true,
            name: request.groupName,
            users: [request.sender, ...request.receivers],
            admin: request.sender
        });

        request.status = "accepted"
        await request.save();

        res.json(chat);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const fetchChats = async (req, res) => {
    try {
        const chats = await Chat.find({
            users: { $in: [req.userId] }
        }).populate("users", "username profile.image")
          .populate("admin", "username");

        if (!chats) return res.status(404).json({ message: "Chats not found." });

        res.json(chats);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

export const addToGroup = async (req, res) => {
    try {
        const { chatId, userId } = req.body;

        const chat = await Chat.findById(chatId);

        if (!chat) return res.status(404).json({ message: "Chat not frond." });

        if (chat.users.includes(userId)) {
            return res.status(400).json({ message: "User already in group." });
        }

        chat.users.push(userId);
        await chat.save();

        const updated = await Chat.findById(chatId)
        .populate("users", "username profile.image")
        .populate("admin", "username");

        res.json(updated);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const removeFromGroup = async (req, res) => {
    try {
        const {chatId, userId} = req.body;

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ message: "Chat not found." });
        }
     
        if (!chat.isGroup) return res.status(400).json({ message: "Not a group chat." });

        if (chat.admin.toString() !== req.userId) {
            return res.status(403).json({ message: "Only admin can remove users." });
        }

        if (userId === req.userId) {
            return res.status(400).json({ message: "Use leave group instead." });
        }

        chat.users = chat.users.filter(u => u.toString() !== userId);

        await chat.save();

        const updatedChat = await Chat.findById(chatId)
        .populate("users", "username profile.image")
        .populate("admin", "username");
     
      if (req.io) {  
        req.io.to(chatId).emit("group updated", updatedChat);
        req.io.to(userId).emit("removed from group", { chatId });
      }

        res.json(updatedChat);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const leaveGroup = async (req, res) => {
    try {
        const { chatId} = req.body;

        const chat = await Chat.findById(chatId);

        if (!chat) return res.status(404).json({ message: "Chat not found." });
        if(!chat.isGroup) return res.status(400).json({ message: "Is not a gropu chat."});

        if (!chat.users.includes(req.userId)) {
            return res.status(400).json({ message: "You are not a member of this group."});
        }

        chat.users = chat.users.filter(u => u.toString() !== req.userId);

        if (chat.admin.toString() === req.userId && chat.users.length > 0) {
            chat.admin = chat.users[0];
        }

        await chat.save();

        const updatedChat = await Chat.findById(chatId)
        .populate("users", "username profile.image")
        .populate("admin", "username");

        if (req.io) {
           req.io.to(chatId).emit("group updated", updatedChat);
        }

        res.json({ message: "Successfully left the group." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}