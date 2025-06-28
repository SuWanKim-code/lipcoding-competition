import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setProfile(res.data);
        setName(res.data.profile.name || "");
        setBio(res.data.profile.bio || "");
        setRole(res.data.role);
        setSkills((res.data.profile.skills || []).join(", "));
        setImagePreview(`http://localhost:8080${res.data.profile.imageUrl}`);
        localStorage.setItem("role", res.data.role); // 역할을 localStorage에 저장
        // 이미 프로필이 등록되어 있으면 멘토는 /requests, 멘티는 /mentors로 이동
        if (res.data.profile.name && res.data.profile.bio) {
          if (res.data.role === "mentor") navigate("/requests");
          else if (res.data.role === "mentee") navigate("/mentors");
        }
      } catch (err) {
        setError("프로필 정보를 불러올 수 없습니다.");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("jpg/png 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("이미지 크기는 1MB 이하만 가능합니다.");
      return;
    }
    setError("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    let imageBase64 = null;
    if (image) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        imageBase64 = reader.result.split(",")[1];
        await submitProfile(imageBase64);
      };
      reader.readAsDataURL(image);
    } else {
      await submitProfile(null);
    }
  };

  const submitProfile = async (imageBase64) => {
    try {
      const payload = {
        name,
        bio,
        image: imageBase64,
        skills: role === "mentor" ? skills : undefined,
      };
      await axios.put("http://localhost:8080/api/profile", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (role === "mentor") navigate("/requests");
      else navigate("/mentors");
    } catch (err) {
      setError("프로필 저장에 실패했습니다.");
    }
  };

  if (!profile) return <div>로딩 중...</div>;

  return (
    <div className="profile-container">
      <h2>내 프로필</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">이름</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="bio">소개</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        {role === "mentor" && (
          <div>
            <label htmlFor="skillsets">기술스택(쉼표로 구분)</label>
            <input
              id="skillsets"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>
        )}
        <div>
          <label htmlFor="profile">프로필 이미지</label>
          <br />
          <img
            id="profile-photo"
            src={imagePreview}
            alt="프로필"
            style={{
              width: 100,
              height: 100,
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
          <input
            id="profile"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageChange}
          />
        </div>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {success && <div style={{ color: "green" }}>{success}</div>}
        <button id="save" type="submit">
          저장
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
