import React, { useEffect, useState } from "react";
import axios from "axios";

function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState("");
  const [error, setError] = useState("");
  const [messageMap, setMessageMap] = useState({}); // 멘토별 메시지 상태
  const [successMap, setSuccessMap] = useState({}); // 멘토별 성공 메시지

  const fetchMentors = async (params = {}) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8080/api/mentors", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setMentors(res.data);
    } catch (err) {
      setError("멘토 목록을 불러올 수 없습니다.");
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMentors({ skill: search, order_by: orderBy });
  };

  // 멘토별 메시지 입력 핸들러
  const handleMessageChange = (mentorId, value) => {
    setMessageMap((prev) => ({ ...prev, [mentorId]: value }));
  };

  // 매칭 요청 보내기
  const handleRequest = async (mentorId) => {
    setError("");
    setSuccessMap((prev) => ({ ...prev, [mentorId]: "" }));
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8080/api/match-requests",
        {
          mentorId,
          message: messageMap[mentorId] || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMap((prev) => ({ ...prev, [mentorId]: "요청이 전송되었습니다." }));
    } catch (err) {
      setError("요청 전송에 실패했습니다. (중복/권한/상태 확인)");
    }
  };

  return (
    <div className="mentors-container">
      <h2>멘토 목록</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
        <input
          id="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="기술스택 검색"
        />
        <select
          id="name"
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="">정렬 없음</option>
          <option value="name">이름순</option>
        </select>
        <select
          id="skill"
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="">정렬 없음</option>
          <option value="skill">기술스택순</option>
        </select>
        <button type="submit" style={{ marginLeft: 8 }}>
          검색
        </button>
      </form>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        {mentors.length === 0 && <div>멘토가 없습니다.</div>}
        {mentors.map((mentor) => (
          <div
            className="mentor"
            key={mentor.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <img
              src={`http://localhost:8080${mentor.profile.imageUrl}`}
              alt="프로필"
              style={{
                width: 60,
                height: 60,
                objectFit: "cover",
                borderRadius: 8,
                marginRight: 12,
              }}
            />
            <div>
              <b>{mentor.profile.name}</b>
            </div>
            <div>{mentor.profile.bio}</div>
            <div>
              기술스택: {mentor.profile.skills && mentor.profile.skills.join(", ")}
            </div>
            {/* 매칭 요청 UI */}
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                placeholder="요청 메시지"
                value={messageMap[mentor.id] || ""}
                onChange={(e) => handleMessageChange(mentor.id, e.target.value)}
                style={{ width: 200, marginRight: 8 }}
              />
              <button
                onClick={() => handleRequest(mentor.id)}
                disabled={!(messageMap[mentor.id] && messageMap[mentor.id].trim())}
              >
                매칭 요청
              </button>
              {successMap[mentor.id] && (
                <span style={{ color: "green", marginLeft: 8 }}>{successMap[mentor.id]}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MentorsPage;
