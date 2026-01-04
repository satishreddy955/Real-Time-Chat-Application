import express from "express";
import User from "../models/User.js";
import Chat from "../models/Chat.js"; // 🔥 REQUIRED
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

// =======================
// GET ALL USERS (WITH chatId)
// =======================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    // 1️⃣ Get all users except self
    const users = await User.find(
      { _id: { $ne: loggedInUserId } },
      "name email"
    );

    // 2️⃣ Get all chats where logged-in user is a participant
    const chats = await Chat.find({
      participants: loggedInUserId
    });

    // 3️⃣ Attach chatId to each user
    const usersWithChatId = users.map((user) => {
      const chat = chats.find((c) =>
        c.participants.some(
          (p) => p.toString() === user._id.toString()
        )
      );

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        chatId: chat ? chat._id : null
      };
    });

    res.json(usersWithChatId);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =======================
// GET LAST SEEN
// =======================
router.get("/lastseen/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("lastSeen");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
