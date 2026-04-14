import mongoose from "mongoose";


const groupRequestSchema = new mongoose.Schema({
    groupName: String,
    groupImage: String,
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    receivers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

export default mongoose.model("GroupRequest", groupRequestSchema);