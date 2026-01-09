import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import authroutes from "./routes/authroutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

connectDB();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authroutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRoutes);


// Socket.IO Setup

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);


// Online Users Store
// userId -> socketId

const onlineUsers = new Map();
app.set("onlineUsers", onlineUsers);


// Socket Events

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);


  // USER ONLINE

  socket.on("userOnline", (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);

    // broadcast presence
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    //  background delivery
    deliverPendingMessages(userId);
  });

  // JOIN CHAT ROOM

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });


  // TYPING INDICATOR

  socket.on("typing", ({ chatId, senderId }) => {
    if (!chatId) return;
    socket.to(chatId).emit("typing", { senderId });
  });

  socket.on("stopTyping", ({ chatId, senderId }) => {
    if (!chatId) return;
    socket.to(chatId).emit("stopTyping", { senderId });
  });


  // MESSAGE SEEN

  socket.on("messageSeen", async ({ chatId, messageIds }) => {
    try {
      const Message = (await import("./models/Message.js")).default;

      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { status: "seen" } }
      );

      socket.to(chatId).emit("messageSeen", { messageIds });
    } catch (err) {
      console.error("Message seen error:", err);
    }
  });


  // GET ONLINE USERS

  socket.on("getOnlineUsers", () => {
    socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });


  // DISCONNECT

  socket.on("disconnect", async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));

      //  update last seen
      const User = (await import("./models/User.js")).default;
      await User.findByIdAndUpdate(socket.userId, {
        lastSeen: new Date()
      });
    }

    console.log("Socket disconnected:", socket.id);
  });
});


// BACKGROUND DELIVERY FUNCTION

const deliverPendingMessages = async (userId) => {
  try {
    const Message = (await import("./models/Message.js")).default;
    const Chat = (await import("./models/Chat.js")).default;

    const pendingMessages = await Message.find({ status: "sent" });

    for (const msg of pendingMessages) {
      const chat = await Chat.findById(msg.chat);
      if (!chat) continue;

      const receiverId = chat.participants.find(
        (id) => id.toString() !== msg.sender.toString()
      );

      if (receiverId?.toString() === userId) {
        msg.status = "delivered";
        await msg.save();

        const senderSocketId = onlineUsers.get(
          msg.sender.toString()
        );

        if (senderSocketId) {
          io.to(senderSocketId).emit("messageDelivered", {
            messageId: msg._id
          });
        }
      }
    }
  } catch (err) {
    console.error("Delivery background error:", err);
  }
};



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
