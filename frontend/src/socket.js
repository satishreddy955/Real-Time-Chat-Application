import { io } from "socket.io-client";

const socket = io("https://real-time-chat-application-1-0hnv.onrender.com", {
  transports: ["websocket"],
  autoConnect: false
});

export default socket;
