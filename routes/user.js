import express from "express";
import { searchUsers, getUserById, getRecommendedUsers, getSentRequests, theme } from "../controllers/userController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.put("/theme", auth, theme);

router.get("/search", auth, searchUsers);

router.get("/recommended", auth, getRecommendedUsers);

router.get("/friends/sent", auth, getSentRequests);

router.get("/:id", auth, getUserById);


export default router;