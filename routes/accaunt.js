import express from "express";
import bcrypt, { genSalt } from "bcrypt";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import { upload } from "../middleware/upload.js";


const router = express.Router();

router.put("/update", auth, async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found. "});

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is difrent." });

    user.username = username;

    if (newPassword) {
        const salt = await genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
    });
});


router.put("/profile-image", auth, upload.single("image"), async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!req.file) {
        return res.status(400).json({ message: "File is not updated." });
    }

    if (!user.profile) {
        user.profile = {}
    }

    user.profile.image = req.file.filename;

    await user.save();

    res.json({ image: user.profile.image });
});

router.delete("/deleteAcc", auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) return res.status(404).json({ message: "User not found." });

        await User.findByIdAndDelete(user);

        res.json({ message: "Accaunt  deleted successfully." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/test", (req, res) => {
    res.json({ message: "Accaunt router works." });
});

export default router;