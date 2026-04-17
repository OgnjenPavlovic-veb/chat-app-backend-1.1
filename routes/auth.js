import express from "express";
import { body ,validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: {messgae: "Too many failed attempts from this IP address, try again in 5 minutes."},
    standardHeaders: true, 
    legacyHeaders: false,
});

const router = express.Router();

router.post("/register", authLimiter, [
    body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .escape(),
    body("email")
    .isEmail()
    .notEmpty()
    .trim()
    .normalizeEmail()
    .escape(),
    body("password")
    .trim()
    .isLength({ min: 8, max: 20 })
    .custom((value) => {
        if (typeof value !== "string") throw new Error ("Password error, Passwprd je popunjen");
        const trimed = value.trim();
        if (trimed !== value) throw new Error ("Passwprd ne sme imati razmake na pocetku i kraju.");
        if (trimed.length < 8) throw new Error ("Password ne sme imati manje od 8 karaktera.");
        return true;
    }),
    body("passwordConfirm")
    .trim()
    .custom((value, {req}) => {
        if (value !== req.body.password) {
             throw new Error ("Password se ne poklapa.");
        }
        return true;
    }),

 ], async (req, res) => {
        const error = validationResult(req);

        if (!error.isEmpty()) {
            return res.status(400).json({ message: error.array()[0].msg });
        }

        const { username, email, password } = req.body;

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                console.log("User existing");
                return res.status(400).json({ message: "User existing" });
            }

            const hashedPassowrd = await bcrypt.hash(password, 10);

            const user = new User({
                username,
                email,
                password: hashedPassowrd,
                profile: { display: username }
            });

            await user.save();

            const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, { expiresIn: "7d" });

            res.status(200).json({
                messgae: "Register Passed.",
                token,
                user: { _id: user._id, username: user.username, email: user.email, profile: user.profile}
            })

        } catch (err) {
            console.error("Register error",err);
            res.status(500).json({ message: "Server error." });
        }
    }
)


router.post("/login", authLimiter, async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        if (!emailOrUsername || !password) {
            console.log("Sva polja su obavezna");
            return res.status(400).json({ message: "Sva polja su obavezna."});
        }

        const user = await User.findOne({
            $or: [{email: emailOrUsername}, {username: emailOrUsername}]
        })

        if (!user) {
            console.log("User nije pronadjen.");
            return res.status(401).json({ message: "User nije pronadjen."});
        }
       
        const passwordConfirm = await bcrypt.compare(password, user.password);
        if (!passwordConfirm) {
            console.log("Pogresan password.");
            return res.status(401).json({ message: "Pogresan password." })
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({
            message: "Login passwd.",
            token,
            theme: user.theme,
            user: { _id: user._id, username: user.username, email: user.email, profile: user.profile}
        });

    } catch (err) {
        console.error('Login error', err);
        res.status(500).json({ message: "Server error" });
    }
});


router.get("/me", auth, async (req, res) => {
    try {
       const user = await User.findById(req.userId).select("-password");
       if (!user) {
        console.log("User nije pronadjen u '/me' ruti.");
        res.status(401).json({ message: "User nije pronadjen u '/me' ruti." });
       }

       res.status(200).json(user);

    } catch (err) {
        console.error("Error u '/me' ruti.");
        res.status(500).json({ messgae: "server error." });
    }
});

export default router;