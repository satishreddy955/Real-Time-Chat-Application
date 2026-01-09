import express from "express";
import Chat from "../models/Chat.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

// CREATE / GET CHAT
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const myId = req.user.id;

    let chat = await Chat.findOne({
      participants: { $all: [myId, userId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [myId, userId]
      });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//GET CHAT BY ID 
router.get("/:chatId", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate("participants", "name email");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
