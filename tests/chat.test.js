import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../server.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";

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
    await Chat.deleteMany();
    await User.deleteMany();
});


describe("Chat - accessChat", () => {
   it("should create new chat if not exists", async () => {
  
    const user1 = await User.create({
        username: "user1",
        email: "user1@gmail.com",
        password: "12345678"
    });

     const user2 = await User.create({
        username: "user2",
        email: "user2@gmail.com",
        password: "12345678"
    });

    const token = jwt.sign({ id: user1._id}, process.env.JWT_SECRET);

    const res = await request(app)
    .post("/api/chat/")
    .set("Authorization", `Bearer ${token}`)
    .send({ userId: user2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBe(2);

  });


  it("should return existing chat", async () => {

    const user1 = await User.create({
        username: "user1",
        email: "user1@gmail.com",
        password: "12345678"
    });

    const user2 = await User.create({
        username: "user2",
        email: "user2@gmail.com",
        password: "12345678"
    });

    const existingChat = await Chat.create({
        users: [user1._id, user2._id]
    });

    const token = jwt.sign({ id: user1._id}, process.env.JWT_SECRET);

    const res = await request(app)
    .post("/api/chat/")
    .set("Authorization", `Bearer ${token}`)
    .send({
        userId: user2._id
    });

    expect(res.statusCode).toBe(200);
    expect(res.body._id.toString()).toBe(existingChat._id.toString());
  });

});

//---------------------------------------------------------------


describe("Chat - getMessage", () => {

    it("should return messages", async () => {
        const user = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678"
        });

        const chat = await Chat.create({
            users: [user._id]
        });

        await Message.create({
            sender: user._id,
            chat: chat._id,
            test: "test"
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .get(`/api/message/${chat._id}`)
        .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        
    });
});

//--------------------------------------------------------------

describe("Chat - sendMessage", () => {
    it("should send message", async () => {
        const user = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678"
        });

        const chat = await Chat.create({
            users: [user._id]
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .post("/api/message/")
        .set("Authorization", `Bearer ${token}`)
        .send({
            chatId: chat._id,
            text: "Text message"
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.text).toBe("Text message");
    });
});

describe("Chat - getSingleChat", () => {
    it("should return singleChat", async () => {
        const user = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678"
        });

        const chat = await Chat.create({
            users: [user._id]
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .get(`/api/chat/${chat._id}`)
        .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body._id.toString()).toBe(chat._id.toString());
        expect(res.body.users.length).toBe(1);

    });

    it("should return 404 if chat not found", async () => {
        const user = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: "12345678"
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const fakeId = new mongoose.Types.ObjectId;

        const res = await request(app)
        .get(`/api/chat/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

       expect(res.statusCode).toBe(200);
       expect(res.body).toBe(null);
    
    });
});


