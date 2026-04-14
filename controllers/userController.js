import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export const searchUsers = async (req, res) => {
    try {
       
        const query = req.query.query?.trim();

        if (!query) {
            return res.json([]);
        }

        const users = await User.find({
            username: { $regex: query, $options: "i"},
            _id: { $ne: req.userId }
        }).select("username profile.image").limit(10);

        res.json(users);

    } catch (err) {
        console.error("Search User error", err);
        res.status(500).json({ message: "Server error." });
    }
}

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("username profile avatar");

        if (!user) return res.status(404).json({ message: "User not found." });

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}
 
export const getRecommendedUsers = async (req, res) => {
    try {
       const currentUsers = await User.findById(req.userId);
       if (!currentUsers) return res.status(404).json({ message: "Users is not alredy exisist." });

       const myId = req.userId;

       const requests = await FriendRequest.find({
          $or: [
            { sender: myId },
            { receiver: myId }
          ],
          status: "pending"
       })

       const requestedUserIds = requests.map(r => {
        return r.sender.toString() === myId ? r.receiver.toString() : r.sender.toString();
       })
 
       const excludesIds = [ currentUsers._id, ...(currentUsers.friends || []) ];
    
       
       const users = await User.aggregate([
          {
            $match: {
                _id: { 
                    $ne: myId,
                    $nin: [
                        ...excludesIds,
                        ...requestedUserIds,
                        ]
                    }
            }
          }, 
          {
            $sample: { size: 10 }
          }
       ]);
       

       res.json(users);


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}

export const getSentRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            sender: req.userId,
            status: "pending"
        }).select("receiver");

        const ids = requests.map(r => r.receiver.toString());

        res.json(ids);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

export const theme = async (req, res) => {
    try {
        const { theme } = req.body;

        if (!theme) {
            return res.status(400).json({ message: "Theme is required." });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { theme },
            { returnDocument: "after" }
        );

        res.json(user);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
}