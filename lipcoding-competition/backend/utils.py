from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
import uuid
import os

# This file will contain utility functions for JWT, password hashing, image validation, etc.
# To be implemented in the next step.

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
ISSUER = os.getenv("ISSUER", "lipcoding-competition")
AUDIENCE = os.getenv("AUDIENCE", "lipcoding-app")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: int = None):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_delta or ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "iss": ISSUER,
        "sub": str(data.get("sub")),
        "aud": AUDIENCE,
        "exp": expire,
        "nbf": now,
        "iat": now,
        "jti": str(uuid.uuid4()),
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], audience=AUDIENCE, issuer=ISSUER)
