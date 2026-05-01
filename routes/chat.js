import express from "express";
import auth from "../middleware/auth.js";
import { accessChat, getSingleChat } from "../controllers/chatController.js";
import { createGroupRequest, 
         acceptGroupRequest, 
         createGroupChat, 
         fetchChats, 
         addToGroup, 
         removeFromGroup, 
         leaveGroup,
         groupLimiter,
         deleteGroup,
         updateGroup 
        } from "../controllers/groupController.js";
import { upload } from '../middleware/cloudinary.js';

const router = express.Router();

router.get("/", auth, fetchChats);

router.post("/", auth, accessChat);

router.get("/:id", auth, getSingleChat);

router.post("/group", auth, upload.single("image"), groupLimiter, createGroupChat);

router.post("/group/create", auth, createGroupRequest);

router.post("/group/accept", auth, acceptGroupRequest);

router.put("/group/add", auth, addToGroup);

router.put("/group/remove", auth, removeFromGroup);

router.put("/group/leave", auth, leaveGroup);

router.delete("/deleteGroup", auth, deleteGroup);

router.put("/group/update", auth, upload.single("image"), updateGroup);


export default router;