import { useState } from "react";
import api from "../api/api"; // ✅ CHANGED
import { useNavigate } from "react-router-dom";
import socket from "../socket";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await api.post( // ✅ CHANGED
      "/auth/login",
      { email, password }
    );

    localStorage.setItem("token", res.data.token);

    const payload = JSON.parse(
      atob(res.data.token.split(".")[1])
    );

    // 🔥 WAIT FOR SOCKET CONNECT
    socket.connect();

    socket.once("connect", () => {
      socket.emit("userOnline", payload.id);
      navigate("/users");
    });
  };

  return (
    <div className="d-flex align-items-center justify-content-center">
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="card shadow-lg" style={{ width: "420px" }}>
          <div className="card-body">
            <h3 className="text-center mb-4">Login</h3>

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="d-grid gap-2">
                <button className="btn btn-primary">
                  Login
                </button>
              </div>

              <div className="d-grid mt-3">
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate("/register")}
                >
                  New user Register Here
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
