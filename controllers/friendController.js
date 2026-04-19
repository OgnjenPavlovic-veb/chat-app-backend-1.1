import { request } from "express";
import { getIO } from "../socket.js";
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

export const sendRequest = async (req, res) => {
    try {

        const sender = req.userId;
        const { receiverId } = req.body;

        console.log("Sender:", sender, "Receiver:", receiverId);

        if (sender === receiverId) {
            return res.status(400).json({ message: "You cannot add yourself." });
        }

        const senderUser = await User.findById(sender);
        
        if (senderUser.friends.includes(receiverId)) {
            console.log("Već ste prijatelji");
            return res.status(400).json({ message: "Already friends. "});
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                {sender, receiver: receiverId},
                {sender: receiverId, receiver: sender}
            ],
            status: "pending"
        });

        if (existingRequest) {
            console.log("Zahtev već postoji");
            return res.status(400).json({ message: "Request already sent." });
        }

        const Request = new FriendRequest({
            sender,
            receiver: receiverId
        }); 

        await Request.save();

        const populated = await FriendRequest.findById(Request._id)
         .populate("sender", "username profile.image");

        const io = getIO();

        io.to(receiverId.toString()).emit("friend request:new", populated);
            
        res.json({ message: "Friend request sent."});

    } catch (err) {
        console.error("DEBUG ERROR:", err);
        res.status(500).json({ message: "Server error. "});
    }
}

export const getRequests = async (req, res) => {
    try {
      const requests = await FriendRequest.find({
      receiver: req.userId,
      status: "pending"
    }).populate("sender", "username profile.image");


    res.json(requests);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error. "});
    }
}

export const acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await FriendRequest.findById(requestId);

        if (!request) return res.status(404).json({ message: "Requset not found. "});

        request.status = "accepted"

        await request.save();

        await User.findByIdAndUpdate(request.sender, {
            $push: {friends: request.receiver}
        });

        await User.findByIdAndUpdate(request.receiver, {
            $push: {friends: request.sender}
        });

        res.json({ message: "Friend request accepted." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

export const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await FriendRequest.findById(requestId);

        if (!request) return res.status(404).json({ message: "Request not found. "});

        request.status = "rejected"
        await request.save();

        res.json({ message: "Friend request rejected." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." }); 
    }
}

export const getFriends = async (req, res) => {
    try {
        // should return friends list
        const user = await User.findById(req.userId)
        .populate("friends", "username profile.image");

        res.json(user.friends);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const removeFriend = async (req, res) => {
    const session = await mongoose.startSession();
    let committed = false;
    try {
        session.startTransaction();
        const userId = req.userId;
        const { friendId } = req.body;
        const user = await User.findById(userId);

        if (!friendId) {
          return res.status(400).json({ message: "Friend ID missing" });
        }

        if (userId === friendId) {
            throw new Error ("Cannot remove yourself");
        }

        if (!user.friends.includes(friendId)) {
            return res.status(400).json({ message: "Not friends" });
        }

        await User.findByIdAndUpdate(userId, {
            $pull: { friends: friendId }
        }, { session });

        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: userId}
        }, { session });

        const chat = await Chat.findOne({
            isGroup: false,
            users: { $all: [userId, friendId]}
        }).session(session);

        if (chat) {
            await Message.deleteMany({ chat: chat._id }).session(session);

            await Chat.findByIdAndDelete(chat._id).session(session);
        }

        await session.commitTransaction();
        committed = true;


        const io = getIO();

        io.to(friendId.toString()).emit("friend removed", {
            friendId: userId
        });

        io.to(userId.toString()).emit("friend removed", {
            friendId: friendId
        });

        res.json({ message: "Friend removed" });

    } catch (err) {
         if (!committed) {
            await session.abortTransaction();
        }

        console.error(err);
        res.status(500).json({ message: "Server error." });
    } finally {
        session.endSession();
    }
}

