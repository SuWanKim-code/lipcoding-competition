#!/bin/zsh
# mentor-mentee API 테스트 스크립트 (curl 기반)
# 백엔드 서버가 localhost:8000에서 실행 중이어야 합니다.

API_URL="http://localhost:8000"
EMAIL="testuser@example.com"
PASSWORD="testpassword123"
NAME="테스트유저"
ROLE="mentee"

# 1. 회원가입
RESPONSE=$(curl -s -X POST "$API_URL/signup" \
  -H "Content-Type: application/json" \
  -d '{"email": "'$EMAIL'", "password": "'$PASSWORD'", "name": "'$NAME'", "role": "'$ROLE'"}')
echo "[회원가입 응답] $RESPONSE"

# 2. 로그인 (JWT 토큰 획득)
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "'$EMAIL'", "password": "'$PASSWORD'"}')
echo "[로그인 응답] $LOGIN_RESPONSE"
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d':' -f2 | tr -d '"')

if [ -z "$TOKEN" ]; then
  echo "[오류] JWT 토큰 획득 실패"
  exit 1
fi

# 3. 내 프로필 조회
PROFILE=$(curl -s -X GET "$API_URL/profile" \
  -H "Authorization: Bearer $TOKEN")
echo "[프로필 조회] $PROFILE"

# 4. 멘토 목록 조회
MENTORS=$(curl -s -X GET "$API_URL/mentors" \
  -H "Authorization: Bearer $TOKEN")
echo "[멘토 목록] $MENTORS"

# 5. 멘토에게 매칭 요청 (멘토 ID 필요, 예시로 1 사용)
MATCH=$(curl -s -X POST "$API_URL/match" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mentor_id": 1}')
echo "[매칭 요청] $MATCH"

# 6. 매칭 요청 목록 조회
REQUESTS=$(curl -s -X GET "$API_URL/requests" \
  -H "Authorization: Bearer $TOKEN")
echo "[매칭 요청 목록] $REQUESTS"

echo "\n[API 테스트 완료]"
