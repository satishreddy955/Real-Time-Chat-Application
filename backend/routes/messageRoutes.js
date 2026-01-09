import express from "express";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();


// SEND MESSAGE

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const senderId = req.user.id;

    //  Save message as SENT
    const message = await Message.create({
      chat: chatId,
      sender: senderId,
      text,
      status: "sent"
    });

    const populatedMessage = await message.populate(
      "sender",
      "name"
    );

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    //  Emit message to chat room
    io.to(chatId.toString()).emit(
      "receiveMessage",
      populatedMessage
    );

    // NOTIFY USERS PAGE (UNREAD COUNT)
    io.emit("unreadUpdate", { chatId });


    // DELIVERY CHECK

    const chat = await Chat.findById(chatId);

    if (chat) {
      const receiverId = chat.participants.find(
        (id) => id.toString() !== senderId
      );

      // If receiver is ONLINE (any page)
      if (receiverId && onlineUsers.has(receiverId.toString())) {
        message.status = "delivered";
        await message.save();

        // notify ONLY sender
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageDelivered", {
            messageId: message._id
          });
        }
      }
    }

    //  Response
    res.status(201).json(populatedMessage);

  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Message send failed" });
  }
});


// FETCH MESSAGES

router.get("/:chatId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      chat: req.params.chatId
    })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET UNREAD COUNT FOR A CHAT

router.get(
  "/unread/:chatId",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const count = await Message.countDocuments({
        chat: req.params.chatId,
        sender: { $ne: userId },
        status: { $ne: "seen" }
      });

      res.json({ unreadCount: count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
