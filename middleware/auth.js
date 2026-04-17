import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "authHeader error. "});
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Invalid token." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id
        next();
    } catch (err) {
        console.error("Token verification failed:", err.message);
        return res.status(401).json({ message: "Token is not valid or expired." });
    } 

}

export default auth;