import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import socket from "./socket";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Users from "./pages/Users";
import Chat from "./pages/Chat";
import PrivateRoute from "./components/PrivateRoute";

const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.id;
};

function App() {
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (!userId) return;

    socket.connect();

    socket.on("connect", () => {
      socket.emit("userOnline", userId);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />

        <Route
          path="/chat/:chatId"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
