# Mentor-Mentee Matching Backend

This is a FastAPI backend for the mentor-mentee matching app.

## Features
- JWT authentication (signup/login)
- User & profile management (mentor/mentee, image upload)
- Mentor list with filter/sort
- Match request (send/accept/reject/cancel)
- OpenAPI & Swagger UI
- SQLite DB auto-init

## How to run

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui
- OpenAPI JSON: http://localhost:8080/openapi.json
