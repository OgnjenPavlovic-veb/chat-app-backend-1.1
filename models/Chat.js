import mongoose from "mongoose";

const chatSchema = mongoose.Schema({
    isGroup: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        default: "",
        trim: true,
        maxlength: [25]
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    groupImage: {
       type: String,
       default: "" 
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }
    
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);