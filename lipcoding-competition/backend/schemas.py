from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum

# This file will contain Pydantic schemas for request/response validation.
# To be implemented in the next step.

class UserRole(str, Enum):
    mentor = "mentor"
    mentee = "mentee"

class SignupRequest(BaseModel):
    email: EmailStr
    password: str  # min_length=6은 별도 검증
    name: str
    role: UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str

class UserProfile(BaseModel):
    name: str
    bio: Optional[str] = ""
    imageUrl: Optional[str] = None
    skills: Optional[List[str]] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    profile: UserProfile

class ProfileUpdateRequest(BaseModel):
    name: str
    bio: Optional[str] = ""
    skills: Optional[str] = None  # comma-separated
    image: Optional[str] = None   # base64 encoded
