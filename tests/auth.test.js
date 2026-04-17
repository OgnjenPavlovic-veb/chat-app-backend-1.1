import { jest } from '@jest/globals';
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../server.js";
import User from "../models/User.js";

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
});

describe("Auth - Register", () => {

    it("Should register a new User.", async () => {
        const res = await request(app)
        .post("/api/auth/register")
        .send({
            username: "test123",
            email: "test123@gmail.com",
            password: "12345678",
            passwordConfirm: "12345678"
        });

         expect(res.statusCode).toBe(200)
         expect(res.body.token).toBeDefined();
         expect(res.body.user.email).toBe("test123@gmail.com")
    });

   it("should fail if email already exists", async () => {
        
        await User.create({
            username: "test",
            email: "test@gmail.com",
            password: "12345678"
        });

        const res = await request(app)
        .post("/api/auth/register")
        .send({
            username: "test2",
            email: "test@gmail.com",
            password: "12345678",
            passwordConfirm: "12345678"
        });

        expect(res.statusCode).toBe(400);
   });  


   it("should fail if password is too short", async () => {
        const res = await request(app)
        .post("/api/auth/register")
        .send({
            username: "test",
            email: "test@gmail.com",
            password: "123",
            passwordConfirm: "123"
        });

        expect(res.statusCode).toBe(400);
   });


   it("should fail if fields are missing", async () => {
        const res = await request(app)
        .post("/api/auth/register")
        .send({});

        expect(res.statusCode).toBe(400);
    });
});

//----------------------------------------------------

describe("Auth - Login" , () => {

    it("should login user", async () => {
        const bcrypt = (await import("bcrypt")).default;
        const hashed = await bcrypt.hash("12345678", 10);
    

    await User.create({
        username: "test123",
        email: "test123@gmail.com",
        password: hashed
    });

    const res = await request(app)
    .post("/api/auth/login")
    .send({
        emailOrUsername: "test123@gmail.com",
        password: "12345678"
    });
   
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined(); 
    });

  
    it("should fail with wrong password", async () => {
        const bcrypt = (await import("bcrypt")).default;
        const hashed = await bcrypt.hash("12345678", 10);

        await User.create({
            username: "test123",
            email: "test123@gmail.com",
            password: hashed
        });

        const res = await request(app)
        .post("/api/auth/login")
        .send({
            emailOrUsername: "test123@gmail.com",
            password: "wrongpass"
        });

        expect(res.statusCode).toBe(401);
    });


    it("should fail if fields are missing", async () => {
        const res = await request(app)
        .post("/api/auth/login")
        .send({});

        expect(res.statusCode).toBe(400);
    });
});

//--------------------------------------------------------------------

describe("Auth - /me", () => {

    it("should return user data", async () => {
        const bcrypt = (await import("bcrypt")).default;
        const jwt = (await import("jsonwebtoken")).default;

        const hashed = await bcrypt.hash("12345678", 10);

        const user = await User.create({
            username: "test123",
            email: "test123@gmail.com",
            password: hashed
        });


        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe("test123@gmail.com");
    });
});