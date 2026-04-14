import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/]
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        display: String,
        image: String
    }, 
    avatar: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    theme: {
        type: String,
        default: "default"
    }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);