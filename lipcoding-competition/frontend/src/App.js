import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import MentorsPage from "./pages/MentorsPage";
import RequestsPage from "./pages/RequestsPage";
import './App.css';

function App() {
  const isAuthenticated = !!localStorage.getItem("token");
  const [user, setUser] = useState({ name: "", email: "", role: "" });

  useEffect(() => {
    const fetchMe = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await fetch("http://localhost:8080/api/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser({ name: data.profile.name, email: data.email, role: data.role });
        }
      } catch {}
    };
    fetchMe();
  }, [isAuthenticated]);

  const role = user.role || localStorage.getItem("role");

  return (
    <Router>
      <div className="main-center-container">
        {/* 우측 상단 사용자 정보 */}
        {isAuthenticated && (
          <div style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 1000,
            background: "#fff",
            borderRadius: 8,
            padding: "7px 16px 7px 16px",
            fontSize: 13,
            boxShadow: "0 2px 8px #0001",
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
            minHeight: 0,
            border: '1px solid #e0e0e0',
            maxWidth: 420,
            overflow: 'hidden',
          }}>
            <span style={{ fontWeight: 500, fontSize: 14, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{user.name}</span>
            <span style={{ color: '#888', fontSize: 12, marginLeft: 4, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{user.email}</span>
            <span style={{ color: '#b0b', fontSize: 12, marginLeft: 4, minWidth: 32, textAlign: 'center' }}>{role === "mentor" ? "멘토" : role === "mentee" ? "멘티" : ""}</span>
            <button
              id="logout-button"
              style={{ marginLeft: 10, padding: '2px 10px', fontSize: 12, border: '1px solid #ccc', borderRadius: 5, background: '#f8fafc', cursor: 'pointer', color: '#444', fontWeight: 400, height: 26 }}
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                window.location.href = "/login";
              }}
            >
              로그아웃
            </button>
          </div>
        )}
        {/* 라우팅되는 페이지를 카드 박스에 감싸기 */}
        <div className="card-box">
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
            {isAuthenticated && role === "mentor" && (
              <Route path="/requests" element={<RequestsPage />} />
            )}
            {isAuthenticated && role === "mentee" && (
              <Route path="/mentors" element={<MentorsPage />} />
            )}
            <Route path="/" element={<Navigate to="/signup" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
