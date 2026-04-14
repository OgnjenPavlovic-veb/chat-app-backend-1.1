import express from "express";
import auth from "../middleware/auth.js";
import { accessChat, getSingleChat } from "../controllers/chatController.js";
import { createGroupRequest, 
         acceptGroupRequest, 
         createGroupChat, 
         fetchChats, 
         addToGroup, 
         removeFromGroup, 
         leaveGroup 
        } from "../controllers/groupController.js";
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get("/", auth, fetchChats);

router.post("/", auth, accessChat);

router.get("/:id", auth, getSingleChat);

router.post("/group", auth, upload.single("image"), createGroupChat);

router.post("/group/create", auth, createGroupRequest);

router.post("/group/accept", auth, acceptGroupRequest);

router.put("/group/add", auth, addToGroup);

router.put("/group/remove", auth, removeFromGroup);

router.put("/group/leave", auth, leaveGroup);


export default router;