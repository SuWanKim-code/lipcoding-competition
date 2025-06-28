from sqlalchemy import Column, Integer, String, Enum, Text, LargeBinary, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import enum
import datetime

class UserRole(str, enum.Enum):
    mentor = "mentor"
    mentee = "mentee"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    name = Column(String, nullable=False)
    bio = Column(Text, default="")
    image = Column(LargeBinary, nullable=True)  # 원본 이미지 바이너리
    image_mime = Column(String, nullable=True)  # 이미지 MIME 타입
    skills = Column(Text, nullable=True)  # mentor만: 콤마구분 문자열
    match_requests_sent = relationship("MatchRequest", back_populates="mentee", foreign_keys='MatchRequest.mentee_id')
    match_requests_received = relationship("MatchRequest", back_populates="mentor", foreign_keys='MatchRequest.mentor_id')

class MatchStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"

class MatchRequest(Base):
    __tablename__ = "match_requests"
    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(Enum(MatchStatus), default=MatchStatus.pending)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="match_requests_received")
    mentee = relationship("User", foreign_keys=[mentee_id], back_populates="match_requests_sent")
