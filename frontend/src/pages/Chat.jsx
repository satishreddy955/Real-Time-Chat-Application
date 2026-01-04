import { useEffect, useState, useRef } from "react";
import api from "../api/api"; // ✅ CHANGED
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";

// =======================
// Helpers
// =======================
const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.id;
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

// =======================
// Chat Component
// =======================
const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [chatPartnerId, setChatPartnerId] = useState(null);
  const [chatPartnerName, setChatPartnerName] = useState("User");

  const token = localStorage.getItem("token");
  const loggedInUserId = getUserIdFromToken();

  // =======================
  // FETCH MESSAGES
  // =======================
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchMessages = async () => {
      const res = await api.get(`/messages/${chatId}`); // ✅ CHANGED

      setMessages(res.data);

      const firstOtherMsg = res.data.find((m) => {
        const senderId =
          typeof m.sender === "string"
            ? m.sender
            : m.sender?._id;
        return senderId !== loggedInUserId;
      });

      if (firstOtherMsg) {
        const partnerId =
          typeof firstOtherMsg.sender === "string"
            ? firstOtherMsg.sender
            : firstOtherMsg.sender._id;

        setChatPartnerId(partnerId);
        setChatPartnerName(firstOtherMsg.sender.name);
      }
    };

    fetchMessages();
  }, [chatId, navigate, token, loggedInUserId]);

  // =======================
  // SOCKET: ONLINE USERS
  // =======================
  useEffect(() => {
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.emit("getOnlineUsers");

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, []);

  // =======================
  // SOCKET: CHAT EVENTS
  // =======================
  useEffect(() => {
    socket.emit("joinChat", chatId);

    socket.on("receiveMessage", (message) => {
      const senderId =
        typeof message.sender === "string"
          ? message.sender
          : message.sender?._id;

      if (senderId !== loggedInUserId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("messageDelivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, status: "delivered" }
            : m
        )
      );
    });

    socket.on("messageSeen", ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m._id)
            ? { ...m, status: "seen" }
            : m
        )
      );
    });

    socket.on("typing", ({ senderId }) => {
      if (senderId !== loggedInUserId) setIsTyping(true);
    });

    socket.on("stopTyping", ({ senderId }) => {
      if (senderId !== loggedInUserId) setIsTyping(false);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDelivered");
      socket.off("messageSeen");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [chatId, loggedInUserId]);

  // =======================
  // MARK MESSAGES AS SEEN
  // =======================
  useEffect(() => {
    const unseenIds = messages
      .filter(
        (m) =>
          m.sender?._id !== loggedInUserId &&
          m.status !== "seen"
      )
      .map((m) => m._id);

    if (unseenIds.length > 0) {
      socket.emit("messageSeen", {
        chatId,
        messageIds: unseenIds
      });
    }
  }, [messages, chatId, loggedInUserId]);

  // =======================
  // AUTO SCROLL
  // =======================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // =======================
  // SEND MESSAGE
  // =======================
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    socket.emit("stopTyping", {
      chatId,
      senderId: loggedInUserId
    });

    const res = await api.post("/messages", { chatId, text }); // ✅ CHANGED

    setMessages((prev) => [...prev, res.data]);
    setText("");
  };

  const isPartnerOnline =
    chatPartnerId && onlineUsers.includes(chatPartnerId);

  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    if (!chatPartnerId || isPartnerOnline) return;

    const fetchLastSeen = async () => {
      const res = await api.get(
        `/users/lastseen/${chatPartnerId}` // ✅ CHANGED
      );
      setLastSeen(res.data.lastSeen);
    };

    fetchLastSeen();
  }, [chatPartnerId, isPartnerOnline, token]);
  
  // =======================
  // UI
  // =======================
  return (
    <div className="container-fluid vh-100 d-flex justify-content-center bg-light mt-2" style={{}}>
      <div className="card shadow-lg w-100" style={{ maxWidth: "85vw", height: "95vh" }}>

        {/* HEADER */}
        <div className="card-header d-flex flex-column">
          <div className="d-flex align-items-center gap-2 fw-bold fs-5">
            {chatPartnerName}
            <span
              style={{
                height: "10px",
                width: "10px",
                borderRadius: "50%",
                backgroundColor: isPartnerOnline ? "green" : "gray"
              }}
            />
            <small className="text-muted fs-6">
  {isPartnerOnline
    ? "Online"
    : lastSeen
    ? `Last seen at ${new Date(lastSeen).toLocaleTimeString()}`
    : "Offline"}
</small>

          </div>

          {/* 🔥 TYPING INDICATOR */}
          {isTyping && (
            <small className="text-muted ps-1">
              Typing...
            </small>
          )}
        </div>

        {/* CHAT BODY */}
        <div className="card-body bg-light overflow-auto" style={{ flex: 1 }}>
          {messages.map((msg) => {
            const senderId =
              typeof msg.sender === "string"
                ? msg.sender
                : msg.sender?._id;

            const isSender = senderId === loggedInUserId;

            return (
              <div
                key={msg._id}
                className={`d-flex mb-3 ${
                  isSender
                    ? "justify-content-end"
                    : "justify-content-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-3 ${
                    isSender
                      ? "bg-success text-white"
                      : "bg-white"
                  }`}
                  style={{ maxWidth: "60%" }}
                >
                  {msg.text}
                  <div className="text-end mt-1">
                    <small className="text-muted">
                      {formatTime(msg.createdAt)}
                      {isSender && (
                        <span
                          style={{
                            marginLeft: "6px",
                            color:
                              msg.status === "seen"
                                ? "#0d6efd"
                                : "black"
                          }}
                        >
                          {msg.status === "sent" ? "✓" : "✓✓"}
                        </span>
                      )}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* FOOTER */}
        <div className="card-footer">
          <form onSubmit={sendMessage} className="d-flex gap-2">
            <input
              className="form-control"
              value={text}
              onChange={(e) => {
                setText(e.target.value);

                socket.emit("typing", {
                  chatId,
                  senderId: loggedInUserId
                });

                if (window.typingTimeout) {
                  clearTimeout(window.typingTimeout);
                }

                window.typingTimeout = setTimeout(() => {
                  socket.emit("stopTyping", {
                    chatId,
                    senderId: loggedInUserId
                  });
                }, 1000);
              }}
              placeholder="Type a message..."
            />
            <button className="btn btn-primary px-4">
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Chat;
