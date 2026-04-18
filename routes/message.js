import express from 'express';
import auth from "../middleware/auth.js";
import { getMessages, sendMessage } from '../controllers/chatController.js';
import { upload } from '../middleware/cloudinary.js';

const router = express.Router();

router.get("/:chatId", auth, getMessages);

router.post("/", auth, upload.array("images", 10), sendMessage);

export default router;