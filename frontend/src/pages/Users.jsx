import { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessageTime, setLastMessageTime] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // GET USER ID FROM TOKEN 
  const getUserIdFromToken = () => {
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  };

  //LOGOUT 
  const handleLogout = () => {
    socket.disconnect();
    localStorage.removeItem("token");
    navigate("/login");
  };

  // MARK USER ONLINE
  useEffect(() => {
    if (!token) return navigate("/login");

    const userId = getUserIdFromToken();
    if (!userId) return;

    socket.connect();
    socket.emit("userOnline", userId);
    socket.emit("getOnlineUsers");
  }, [token, navigate]);

  // FETCH USERS 
  useEffect(() => {
    if (!token) return navigate("/login");

    api
      .get("/users") // 
      .then((res) => setUsers(res.data))
      .catch(() => navigate("/login"));
  }, [navigate, token]);

  //FETCH LAST MESSAGE 
  const fetchLastMessageTime = async (chatId) => {
    if (!chatId) return;

    try {
      const res = await api.get(`/messages/${chatId}`); 

      if (res.data.length > 0) {
        const lastMsg = res.data[res.data.length - 1];
        setLastMessageTime((prev) => ({
          ...prev,
          [chatId]: new Date(lastMsg.createdAt).getTime()
        }));
      }
    } catch (err) {
      console.error("Last message fetch failed", err);
    }
  };

  // FETCH UNREAD COUNT 
  const fetchUnreadCount = async (chatId) => {
    if (!chatId) return;

    try {
      const res = await api.get(
        `/messages/unread/${chatId}` 
      );

      setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: res.data.unreadCount
      }));
    } catch (err) {
      console.error("Unread fetch failed", err);
    }
  };

  // INITIAL LOAD 
  useEffect(() => {
    users.forEach((user) => {
      if (user.chatId) {
        fetchUnreadCount(user.chatId);
        fetchLastMessageTime(user.chatId);
      }
    });
  }, [users]);

  //REALTIME MESSAGE UPDATE
  useEffect(() => {
    const handleNewMessage = ({ chatId }) => {
      fetchUnreadCount(chatId);
      fetchLastMessageTime(chatId);
    };

    socket.on("unreadUpdate", handleNewMessage);
    socket.on("receiveMessage", handleNewMessage);

    return () => {
      socket.off("unreadUpdate", handleNewMessage);
      socket.off("receiveMessage", handleNewMessage);
    };
  }, []);

  //ONLINE USERS LISTENER
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("onlineUsers");
  }, []);

  //START CHAT 
  const startChat = async (otherUserId) => {
    const res = await api.post( 
      "/chat",
      { userId: otherUserId }
    );

    navigate(`/chat/${res.data._id}`);
  };

  // SORT USERS  
  const sortedUsers = [...users].sort((a, b) => {
    const timeA = lastMessageTime[a.chatId] || 0;
    const timeB = lastMessageTime[b.chatId] || 0;
    return timeB - timeA;
  });

  return (
    <div className="container-fluid min-vh-100 py-4" style={{ width: "500px" }}>
      <div className="d-flex justify-content-around align-items-center mb-4">
        <h4 className="m-0">Users</h4>
        <button className="btn btn-danger btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-7">
          <div className="card shadow-lg border-0">
            <div className="card-body">
              <div className="list-group list-group-flush">
                {sortedUsers.map((user) => {
                  const isOnline = onlineUsers.includes(user._id);

                  return (
                    <button
                      key={user._id}
                      className="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center"
                      onClick={() => startChat(user._id)}
                    >
                      <div>
                        <div className="fw-semibold">
                          {user.name}
                          {isOnline && (
                            <span className="ms-2 text-success">●</span>
                          )}
                        </div>
                        <div className="text-muted small">{user.email}</div>
                      </div>

                      {user.chatId && unreadCounts[user.chatId] > 0 && (
                        <span className="badge bg-primary rounded-pill">
                          {unreadCounts[user.chatId]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
