import express from "express";
import auth from "../middleware/auth.js";
import { sendRequest, getRequests, acceptRequest, rejectRequest, getFriends, removeFriend } from "../controllers/friendController.js";

const router = express.Router();


router.post("/request", auth, sendRequest);

router.get("/request", auth, getRequests);

router.post("/accept", auth, acceptRequest);

router.post("/reject", auth, rejectRequest);

router.put("/remove-friend", auth, removeFriend);

router.get("/list", auth, getFriends);

export default router;