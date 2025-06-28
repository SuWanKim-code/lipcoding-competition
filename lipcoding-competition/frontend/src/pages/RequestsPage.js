import React, { useEffect, useState } from "react";
import axios from "axios";

function RequestsPage() {
  const [role, setRole] = useState("");
  const [incoming, setIncoming] = useState([]); // 멘토용
  const [outgoing, setOutgoing] = useState([]); // 멘티용
  const [message, setMessage] = useState("");
  const [mentors, setMentors] = useState([]); // 멘티용 멘토 리스트
  const [selectedMentor, setSelectedMentor] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [matchedUser, setMatchedUser] = useState(null); // 매칭된 상대방 정보

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setRole(res.data.role);
        setMatchedUser(res.data.matchedUser || null); // 백엔드에서 매칭된 상대방 정보 제공
        if (res.data.role === "mentor") fetchIncoming();
        else {
          fetchOutgoing();
          fetchMentors();
        }
      } catch (err) {
        setError("권한 정보를 불러올 수 없습니다.");
      }
    };
    fetchRole();
    // eslint-disable-next-line
  }, []);

  const fetchIncoming = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/match-requests/incoming", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setIncoming(res.data);
    } catch (err) {
      setError("요청 목록을 불러올 수 없습니다.");
    }
  };
  const fetchOutgoing = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/match-requests/outgoing", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOutgoing(res.data);
    } catch (err) {
      setError("요청 목록을 불러올 수 없습니다.");
    }
  };
  const fetchMentors = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/mentors", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMentors(res.data);
    } catch (err) {}
  };

  // 멘티: 매칭 요청 보내기
  const handleRequest = async (mentorId) => {
    setError(""); setSuccess("");
    try {
      await axios.post("http://localhost:8080/api/match-requests", {
        mentorId,
        message,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSuccess("요청이 전송되었습니다.");
      fetchOutgoing();
    } catch (err) {
      setError("요청 전송에 실패했습니다. (중복/권한/상태 확인)");
    }
  };

  // 멘티: 요청 취소
  const handleCancel = async (id) => {
    setError(""); setSuccess("");
    try {
      await axios.delete(`http://localhost:8080/api/match-requests/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSuccess("요청이 취소되었습니다.");
      fetchOutgoing();
    } catch (err) {
      setError("요청 취소에 실패했습니다.");
    }
  };

  // 멘토: 요청 수락/거절
  const handleAccept = async (id) => {
    setError(""); setSuccess("");
    try {
      await axios.put(`http://localhost:8080/api/match-requests/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSuccess("요청을 수락했습니다.");
      fetchIncoming();
    } catch (err) {
      setError("수락에 실패했습니다.");
    }
  };
  const handleReject = async (id) => {
    setError(""); setSuccess("");
    try {
      await axios.put(`http://localhost:8080/api/match-requests/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSuccess("요청을 거절했습니다.");
      fetchIncoming();
    } catch (err) {
      setError("거절에 실패했습니다.");
    }
  };

  // 매칭 해제
  const handleUnmatch = async () => {
    setError(""); setSuccess("");
    try {
      await axios.post("http://localhost:8080/api/unmatch", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSuccess("매칭이 해제되었습니다.");
      setMatchedUser(null);
      if (role === "mentor") fetchIncoming();
      else fetchOutgoing();
    } catch (err) {
      setError("매칭 해제에 실패했습니다.");
    }
  };

  return (
    <div className="requests-container">
      <h2>매칭 요청</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      {success && <div style={{color:'green'}}>{success}</div>}
      {/* 매칭된 상대방 정보 표시 */}
      {matchedUser && (
        <div style={{border:'2px solid #4caf50', borderRadius:8, padding:12, marginBottom:16, background:'#f6fff6'}}>
          <b>현재 매칭된 {role === "mentor" ? "멘티" : "멘토"}:</b> {matchedUser.name} ({matchedUser.email})
          <button onClick={handleUnmatch} style={{marginLeft:16}}>매칭 해제</button>
        </div>
      )}
      {/* 멘티: 매칭 요청 보내기 */}
      {role === "mentee" && !matchedUser && (
        <div style={{marginBottom:24}}>
          <h4>멘토에게 매칭 요청 보내기</h4>
          <select value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)}>
            <option value="">멘토 선택</option>
            {mentors.map(m => (
              <option key={m.id} value={m.id}>{m.profile.name}</option>
            ))}
          </select>
          <input
            id="message"
            data-mentor-id={selectedMentor}
            data-testid={`message-${selectedMentor}`}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="요청 메시지"
            style={{marginLeft:8}}
          />
          <button id="request" onClick={() => handleRequest(selectedMentor)} disabled={!selectedMentor || !message} style={{marginLeft:8}}>
            요청
          </button>
        </div>
      )}
      {/* 멘티: 내가 보낸 요청 */}
      {role === "mentee" && (
        <div>
          <h4>내가 보낸 요청</h4>
          {outgoing.length === 0 && <div>보낸 요청이 없습니다.</div>}
          {outgoing.map(r => (
            <div key={r.id} style={{border:"1px solid #ccc", borderRadius:8, padding:8, marginBottom:8, background: r.status === 'accepted' ? '#e6ffe6' : undefined}}>
              <span id="request-status">상태: {r.status}</span>
              {r.status === 'accepted' && matchedUser && (
                <span style={{marginLeft:8, color:'#388e3c'}}>
                  (매칭 멘토: {matchedUser.name})
                </span>
              )}
              <button onClick={() => handleCancel(r.id)} style={{marginLeft:8}} disabled={r.status !== 'pending'}>취소</button>
            </div>
          ))}
        </div>
      )}
      {/* 멘토: 받은 요청 */}
      {role === "mentor" && (
        <div>
          <h4>받은 요청</h4>
          {incoming.length === 0 && <div>받은 요청이 없습니다.</div>}
          {incoming.map(r => (
            <div key={r.id} style={{border:"1px solid #ccc", borderRadius:8, padding:8, marginBottom:8, background: r.status === 'accepted' ? '#e6ffe6' : undefined}}>
              <span className="request-message" mentee={r.menteeId}>{r.message}</span>
              <span id="request-status" style={{marginLeft:8}}>상태: {r.status}</span>
              {r.status === 'accepted' && matchedUser && (
                <span style={{marginLeft:8, color:'#388e3c'}}>
                  (매칭 멘티: {matchedUser.name})
                </span>
              )}
              <button id="accept" onClick={() => handleAccept(r.id)} style={{marginLeft:8}} disabled={matchedUser && r.status !== 'accepted'}>수락</button>
              <button id="reject" onClick={() => handleReject(r.id)} style={{marginLeft:8}} disabled={r.status !== 'pending'}>거절</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RequestsPage;
