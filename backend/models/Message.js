import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    }

  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
