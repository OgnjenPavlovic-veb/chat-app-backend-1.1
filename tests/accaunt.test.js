import { jest } from '@jest/globals';
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../server.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

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

describe("Accaunt - update accaunt", () => {

     it("should update username and password", async () => {

        const bcrypt = (await import("bcrypt")).default;

        const hashedPassword = await bcrypt.hash("12345678", 10);

        const user = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: hashedPassword
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const res = await request(app)
            .put("/api/accaunt/update")
            .set("Authorization", `Bearer ${token}`)
            .send({
                username: "newUser",
                oldPassword: "12345678",
                newPassword: "87654321"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.username).toBe("newUser");

        const updatedUser = await User.findById(user._id);
        const isMatch = await bcrypt.compare("87654321", updatedUser.password);

        expect(isMatch).toBe(true);
    });
});

describe("Accaunt - profile-image", () => {

    it("Should update profile image", async () => {
        const bcrypt = (await import("bcrypt")).default;

        const hashedPassword = await bcrypt.hash("12345678", 10);

        const user = await User.create({
            username: "user",
            email: "user@gmail.com",
            password: hashedPassword
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        const res = await request(app)
        .put("/api/accaunt/profile-image")
        .set("Authorization", `Bearer ${token}`)
        .attach("image", Buffer.from("test file"), "test.png");

        expect(res.statusCode).toBe(200);
        expect(res.body.image).toBeDefined();
    });
});
