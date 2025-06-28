import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("mentor");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("http://localhost:8080/api/signup", {
        email,
        password,
        name,
        role,
      });
      // 회원가입 후 바로 로그인 처리
      const res = await axios.post("http://localhost:8080/api/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      // 역할 정보 저장
      let userRole = role;
      if (!userRole) {
        const me = await axios.get("http://localhost:8080/api/me", {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        userRole = me.data.role;
      }
      localStorage.setItem("role", userRole);
      navigate("/profile");
    } catch (err) {
      setError("회원가입에 실패했습니다. 입력값을 확인하세요.");
    }
  };

  return (
    <div className="signup-container">
      <h2>회원가입</h2>
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
        <div>
          <label htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="role">역할</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="mentor">멘토</option>
            <option value="mentee">멘티</option>
          </select>
        </div>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button id="signup" type="submit">
          회원가입
        </button>
      </form>
    </div>
  );
}

export default SignupPage;
