# FanPulse API Reference

## Base URL

- Development: `http://localhost:8000`
- Production: `https://api.fanpulse.io`

## Authentication

FanPulse uses JWT (JSON Web Tokens) for authentication.

### Register

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "subscription_tier": "solo"
}
```

### Login

```http
POST /api/auth/login
```

**Request Body (Form Data):**
```
username=user@example.com
password=secure_password
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "subscription_tier": "pro"
}
```

---

## Artists

### List Artists

```http
GET /api/artists
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Luna",
    "genre": "Pop",
    "spotify_id": "spotify_artist_id",
    "instagram_id": "luna_official",
    "image_url": "https://...",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

### Create Artist

```http
POST /api/artists
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Luna",
  "genre": "Pop",
  "spotify_id": "spotify_artist_id",
  "instagram_id": "luna_official"
}
```

### Get Artist

```http
GET /api/artists/{artist_id}
Authorization: Bearer <token>
```

### Delete Artist

```http
DELETE /api/artists/{artist_id}
Authorization: Bearer <token>
```

---

## Analytics (Coming in MVP)

### Get Momentum Index

```http
GET /api/analytics/momentum/{artist_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "artist_id": "uuid",
  "momentum": 8.7,
  "trend": "rising",
  "components": {
    "stream_growth": 2.8,
    "engagement_velocity": 2.3,
    "playlist_momentum": 1.8,
    "social_virality": 1.4,
    "discovery": 0.9
  },
  "prediction": {
    "next_7_days": 8.9,
    "next_30_days": 9.2,
    "confidence": 0.82
  }
}
```

### Get Top Superfans

```http
GET /api/analytics/superfans/{artist_id}
Authorization: Bearer <token>
Query Parameters:
  - limit (default: 100)
  - min_fvs (default: 80)
```

**Response:**
```json
{
  "artist_id": "uuid",
  "total_superfans": 150,
  "superfans": [
    {
      "id": "uuid",
      "fvs_score": 95,
      "listening_hours": 12.4,
      "location": "Paris, France",
      "contact": {
        "email": "fan@example.com",
        "instagram": "@fan_username"
      }
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Artist not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

- Default: 100 requests per minute per user
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## Interactive Documentation

Full interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
