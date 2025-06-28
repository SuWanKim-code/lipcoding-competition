import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:8080/api/login", {
        email,
        password,
      });
      console.log("로그인 응답:", res.data); // 실제 응답 구조 확인용
      localStorage.setItem("token", res.data.token); // 필요시 key 수정
      console.log("저장된 토큰:", localStorage.getItem("token"));
      // 역할 정보도 응답에 포함되어 있다고 가정, 없으면 /api/me로 추가 요청
      let role = res.data.role;
      if (!role) {
        // 토큰으로 역할 조회
        const me = await axios.get("http://localhost:8080/api/me", {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        role = me.data.role;
      }
      localStorage.setItem("role", role);
      if (role === "mentor") navigate("/requests");
      else if (role === "mentee") navigate("/mentors");
      else navigate("/profile");
    } catch (err) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="login-container">
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button id="login" type="submit">
          로그인
        </button>
      </form>
      <button
        id="go-signup"
        type="button"
        style={{
          marginTop: 18,
          width: "100%",
          background: "linear-gradient(90deg,#e0e7ff,#c7d2fe)",
          color: "#3b3b4f",
          border: "1.5px solid #bfcfff",
          borderRadius: 8,
          fontWeight: 500,
          fontSize: 15,
        }}
        onClick={() => navigate("/signup")}
      >
        회원가입
      </button>
    </div>
  );
}

export default LoginPage;
