
import { jest } from '@jest/globals';
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../server.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import FriendRequest from "../models/FriendRequest.js";
import { ExpressValidator } from "express-validator";

jest.setTimeout(15000);

let mongo;

beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    
    mongo = await MongoMemoryServer.create();
    const url = mongo.getUri();
    await mongoose.connect(url);
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongo) {
        await mongo.stop();
    }
});

afterEach(async () => {
    await User.deleteMany();
    await FriendRequest.deleteMany();
});

describe("FriendRequest - sendRequest", () => {

    it("should successfully send a friend request", async () => {
        const sender = await User.create({
            username: "sender1",
            email: "sender1@test.com",
            password: "hashedPassword123",
            friends: []
        });

        const receiver = await User.create({
            username: "receiver1",
            email: "receiver1@test.com",
            password: "hashedPassword123",
            friends: []
        });

        const token = jwt.sign({ id: sender._id }, process.env.JWT_SECRET);

        const res = await request(app)
            .post("/api/friends/request")
            .set("Authorization", `Bearer ${token}`)
            .send({ receiverId: receiver._id.toString() });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Friend request sent.");

        const dbRequest = await FriendRequest.findOne({
            sender: sender._id,
            receiver: receiver._id
        });
        expect(dbRequest).not.toBeNull();
        expect(dbRequest.status).toBe("pending");
    });


    it("should fail if sending to yourself", async () => {
        const user = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678",
            friends: []
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .post("/api/friends/request")
        .set("Authorization", `Bearer ${token}`)
        .send({ receiverId: user._id });

        expect(res.statusCode).toBe(400);
    });


    it("should fail if request already exists", async () => {
        const sender = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678",
            friends: []
        });

        const receiver = await User.create({
            username: "receiver",
            email: "receiver@gmail.com",
            password: "12345678",
            friends: []
        });

        await FriendRequest.create({
            sender: sender._id,
            receiver: receiver._id,
            status: "pending"
        });

        const token = jwt.sign({ id: sender._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .post("/api/friends/request")
        .set("Authorization", `Bearer ${token}`)
        .send({ receiverId: receiver._id });

        expect(res.statusCode).toBe(400);

    });
});

describe("FriendRequest - getRequests", () => {
   
    it("should return friend request to friend", async () => {
        const receiver = await User.create({
            username: "receiver",
            email: "receiver@gmail.com",
            password: "12345678",
            friends: []
        });

        const token = jwt.sign({ id: receiver._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .get("/api/friends/request")
        .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
    });

    it("should not return requests if user is not receiver", async () => {
        const receiver = await User.create({
            username: "receiver",
            email: "receiver@gmail.com",
            password: "12345678",
            friends: []
        });

        const sender = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678",
            friends: []
        });

        await FriendRequest.create({
            sender: sender._id,
            receiver: receiver._id,
            status: "pending"
        });

        const token = jwt.sign({ id: sender._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .get("/api/friends/request")
        .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(0);
    });


    it("should return empty array if no requests", async () => {
        const user = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678",
            friends: []
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .get("/api/friends/request")
        .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe("FriendsRequest - acceptRequest", () => {

    it("should return status accepted request", async () => {
        const receiver = await User.create({
            username: "receiver",
            email: "receiver@gmail.com",
            password: "12345678",
            friends: []
        });

        const sender = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678",
            friends: []
        });

       const friendRequest = await FriendRequest.create({
            sender: sender._id,
            receiver: receiver._id,
            status: "pending"
        });

        const token = jwt.sign({ id: receiver._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .post("/api/friends/accept")
        .set("Authorization", `Bearer ${token}`)
        .send({ requestId: friendRequest._id, text: "Friend request accepted." });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Friend request accepted.");

        const updatedRequest = await FriendRequest.findById(friendRequest._id);
        expect(updatedRequest.status).toBe("accepted");
   
        const updatedSender = await User.findById(sender._id);
        const updatedReceiver = await User.findById(receiver._id);

        expect(updatedSender.friends.map(id => id.toString())).toContain(receiver._id.toString());
        expect(updatedReceiver.friends.map(id => id.toString())).toContain(sender._id.toString());
        
    });
});


describe("FrinedsRequest - rejectRequest", () => {

    it("should return friend request status rejected", async () => {
        const sender = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678",
            friends: []
        });

        const receiver = await User.create({
            username: "receiver",
            email: "receiver@gmail.com",
            password: "12345678",
            friends: []
        });

        const friendRequest = await FriendRequest.create({
            sender: sender._id,
            receiver: receiver._id,
            status: "pending"
        });

        const token = jwt.sign({ id: receiver._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .post("/api/friends/reject")
        .set("Authorization", `Bearer ${token}`)
        .send({ requestId: friendRequest._id, text: "Friend request rejected." });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Friend request rejected.");
        
        const updatedStatus = await FriendRequest.findById(friendRequest._id);
        expect(updatedStatus.status).toBe("rejected");
    });
});

describe("FriendsRequest - getFriends", () => {

    it("should return friends list", async () => {
        const user = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678",
            friends: []
        });

        const friend = await User.create({
            username: "friend",
            email: "friend@gmail.com",
            password: "12345678",
            friends: []
        });

        await User.findByIdAndUpdate(user._id, {
         $push: { friends: friend._id }
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .get("/api/friends/list")
        .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toMatchObject({
            username: "friend"
        });
    });
});