# 🔑 Testing API Access System - Complete Guide

This guide shows you how to test the **API Access System** with rate limiting, usage tracking, and analytics.

---

## 📋 **Prerequisites**

1. **Backend running** on http://localhost:8000
2. **PostgreSQL database** active
3. **Celery + Redis** configured (optional for background tasks)
4. **At least 1 user account** created
5. **Migration 005 applied** (API keys tables)

---

## 🚀 **Step 1: Apply Migration**

### **Create the API keys tables**

```bash
cd backend

# Apply migration
alembic upgrade head

# Verify
alembic current
# Should show: 005_api_keys (head)
```

**Rollback if needed:**
```bash
alembic downgrade -1
alembic upgrade head
```

---

## 🔧 **Step 2: Start the Backend**

### **Terminal 1: FastAPI Server**

```bash
cd backend
python -m app.main

# Or with uvicorn:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Check API Docs:**
Open http://localhost:8000/docs

You should see a new section **"api-keys"** with:
- `POST /api/api-keys` - Create new API key
- `GET /api/api-keys` - List your keys
- `GET /api/api-keys/{key_id}` - Get key details
- `GET /api/api-keys/{key_id}/usage` - Get usage stats
- `GET /api/api-keys/{key_id}/rate-limit` - Check rate limit status
- `DELETE /api/api-keys/{key_id}` - Revoke key

---

## 🔑 **Step 3: Test API Key Management**

### **3.1 - Login and Get JWT Token**

```bash
# Login to get JWT token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your_email@example.com&password=your_password"

# Response:
# {
#   "access_token": "eyJhbGci...",
#   "token_type": "bearer"
# }
```

**Save the JWT token:**
```bash
export JWT_TOKEN="eyJhbGci..."
```

---

### **3.2 - Create Your First API Key**

```bash
# Create API key
curl -X POST "http://localhost:8000/api/api-keys" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "description": "API key for production backend",
    "expires_in_days": 365
  }'

# Response:
# {
#   "api_key": "fp_live_abc123def456...",
#   "key_info": {
#     "id": "uuid-here",
#     "name": "Production Server",
#     "key_prefix": "fp_live_",
#     "rate_limit_tier": "solo",
#     "requests_per_hour": 100,
#     "total_requests": 0,
#     "status": "active",
#     "created_at": "2025-11-03T..."
#   }
# }
```

**⚠️ IMPORTANT**: Save the `api_key` value! It won't be shown again.

```bash
export API_KEY="fp_live_abc123def456..."
```

---

### **3.3 - List Your API Keys**

```bash
# Get all your API keys
curl -X GET "http://localhost:8000/api/api-keys" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Response: Array of APIKeyResponse objects
```

---

### **3.4 - Get Key Details**

```bash
# Get specific key details
curl -X GET "http://localhost:8000/api/api-keys/{KEY_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### **3.5 - Check Rate Limit Status**

```bash
# Check current rate limit
curl -X GET "http://localhost:8000/api/api-keys/{KEY_ID}/rate-limit" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Response:
# {
#   "tier": "solo",
#   "requests_per_hour": 100,
#   "current_hour_requests": 5,
#   "remaining": 95
# }
```

---

## 🌐 **Step 4: Test External API Access**

### **4.1 - Using API Key for Authentication**

The API key system creates a **parallel API** at `/api/v1/*` routes.

**Example: Get artist analytics via API key**

```bash
# Make authenticated request with API key
curl -X GET "http://localhost:8000/api/v1/artists/{ARTIST_ID}/analytics" \
  -H "X-API-Key: $API_KEY"

# Or using Bearer format:
curl -X GET "http://localhost:8000/api/v1/artists/{ARTIST_ID}/analytics" \
  -H "Authorization: Bearer $API_KEY"
```

**Rate limit headers in response:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1699027200
```

---

### **4.2 - Test Rate Limiting**

**Quick test script to hit rate limit:**

```bash
# Send 150 requests quickly (exceeds SOLO tier limit of 100/hour)
for i in {1..150}; do
  curl -X GET "http://localhost:8000/api/v1/artists" \
    -H "X-API-Key: $API_KEY" \
    -s -o /dev/null -w "Request $i: %{http_code}\n"
  sleep 0.1
done

# First 100 should return 200
# Requests 101+ should return 429 (Rate Limited)
```

**Expected 429 response:**
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Limit: 100 requests/hour. Try again in 3421 seconds."
  }
}
```

**Response headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699027200
Retry-After: 3421
```

---

### **4.3 - Test Invalid Key**

```bash
# Try with invalid key
curl -X GET "http://localhost:8000/api/v1/artists" \
  -H "X-API-Key: fp_live_invalid_key_123"

# Response: 401 Unauthorized
# {
#   "error": {
#     "code": "invalid_api_key",
#     "message": "Invalid or expired API key"
#   }
# }
```

---

### **4.4 - Test Missing Key**

```bash
# Try without key
curl -X GET "http://localhost:8000/api/v1/artists"

# Response: 401 Unauthorized
# {
#   "error": {
#     "code": "missing_api_key",
#     "message": "API key required. Provide via X-API-Key header."
#   }
# }
```

---

## 📊 **Step 5: Test Usage Tracking**

### **5.1 - Generate Some Traffic**

```bash
# Make various requests to generate usage data
curl -H "X-API-Key: $API_KEY" http://localhost:8000/api/v1/artists
curl -H "X-API-Key: $API_KEY" http://localhost:8000/api/v1/artists/{ARTIST_ID}/analytics
curl -H "X-API-Key: $API_KEY" http://localhost:8000/api/v1/stream-history
curl -H "X-API-Key: $API_KEY" http://localhost:8000/api/v1/momentum/{ARTIST_ID}
```

---

### **5.2 - View Usage Statistics**

```bash
# Get usage stats for last 30 days
curl -X GET "http://localhost:8000/api/api-keys/{KEY_ID}/usage?days=30" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Response:
# {
#   "period_days": 30,
#   "total_requests": 125,
#   "successful_requests": 120,
#   "failed_requests": 5,
#   "rate_limited_requests": 0,
#   "avg_response_time_ms": 45,
#   "top_endpoints": [
#     {"endpoint": "/api/v1/artists", "count": 50},
#     {"endpoint": "/api/v1/artists/{id}/analytics", "count": 40},
#     {"endpoint": "/api/v1/momentum/{id}", "count": 20}
#   ]
# }
```

---

### **5.3 - Check Database Logs**

```sql
-- View recent API key usage logs
SELECT
  ak.name as key_name,
  akl.endpoint,
  akl.method,
  akl.status_code,
  akl.response_time_ms,
  akl.timestamp
FROM api_key_usage_logs akl
JOIN api_keys ak ON akl.api_key_id = ak.id
ORDER BY akl.timestamp DESC
LIMIT 20;

-- View usage by endpoint
SELECT
  endpoint,
  COUNT(*) as requests,
  AVG(response_time_ms) as avg_response_ms
FROM api_key_usage_logs
GROUP BY endpoint
ORDER BY requests DESC;

-- View rate limited requests
SELECT
  ak.name,
  COUNT(*) as rate_limited_count
FROM api_key_usage_logs akl
JOIN api_keys ak ON akl.api_key_id = ak.id
WHERE akl.status_code = 429
GROUP BY ak.name;
```

---

## 🔄 **Step 6: Test Background Tasks**

### **Terminal 2: Celery Worker**

```bash
cd backend
celery -A app.core.celery_app worker --loglevel=info
```

### **Terminal 3: Celery Beat**

```bash
cd backend
celery -A app.core.celery_app beat --loglevel=info
```

**📅 Scheduled tasks:**
- **Daily 1 AM UTC**: Calculate daily usage summaries
- **Daily 2:30 AM UTC**: Clean up old logs (>30 days)
- **Hourly**: Mark expired API keys
- **Every 15 minutes**: Send usage alerts (80%, 90% thresholds)

---

### **6.1 - Test Daily Summary Calculation**

```bash
# In Python shell
cd backend
python

>>> from app.tasks.api_keys import calculate_daily_summaries_task
>>> result = calculate_daily_summaries_task()
>>> print(result)
# {
#   'status': 'success',
#   'date': '2025-11-02',
#   'summaries_created': 5
# }
```

**Check database:**
```sql
SELECT
  aks.date,
  ak.name,
  aks.total_requests,
  aks.successful_requests,
  aks.avg_response_time_ms
FROM api_key_usage_summaries aks
JOIN api_keys ak ON aks.api_key_id = ak.id
ORDER BY aks.date DESC;
```

---

### **6.2 - Test Expired Key Marking**

```bash
# Create a key that expires immediately for testing
curl -X POST "http://localhost:8000/api/api-keys" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Expiring Key",
    "expires_in_days": 1
  }'

# Manually update expiration in database to past date
psql -d fanpulse -c "UPDATE api_keys SET expires_at = NOW() - INTERVAL '1 day' WHERE name = 'Test Expiring Key';"

# Run task
python -c "from app.tasks.api_keys import mark_expired_keys_task; print(mark_expired_keys_task())"

# Check key status
psql -d fanpulse -c "SELECT name, status, expires_at FROM api_keys WHERE name = 'Test Expiring Key';"
# status should be 'expired'
```

---

### **6.3 - Test Log Cleanup**

```bash
# Run cleanup (deletes logs >30 days old)
python -c "from app.tasks.api_keys import cleanup_old_logs_task; print(cleanup_old_logs_task())"

# Response:
# {
#   'status': 'success',
#   'logs_deleted': 1250
# }
```

---

## 🎯 **Step 7: Test Rate Limit Tiers**

### **7.1 - Upgrade User Subscription**

```sql
-- Upgrade user to PRO tier (1,000 requests/hour)
UPDATE users
SET subscription_tier = 'pro'
WHERE email = 'your_email@example.com';
```

### **7.2 - Create New Key with Higher Limit**

```bash
# Create new API key (will automatically get PRO tier rate limit)
curl -X POST "http://localhost:8000/api/api-keys" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Server Key"
  }'

# Response should show:
# "rate_limit_tier": "pro",
# "requests_per_hour": 1000
```

### **7.3 - Verify Higher Limit**

```bash
# Try 150 requests with PRO key (should all succeed)
for i in {1..150}; do
  curl -X GET "http://localhost:8000/api/v1/artists" \
    -H "X-API-Key: $NEW_API_KEY" \
    -s -o /dev/null -w "%{http_code}\n"
done

# All should return 200 (no rate limiting)
```

**Rate limit tiers:**
- **SOLO**: 100 requests/hour
- **PRO**: 1,000 requests/hour
- **LABEL**: 10,000 requests/hour
- **ENTERPRISE**: 100,000 requests/hour

---

## 🔐 **Step 8: Test Key Revocation**

### **8.1 - Revoke a Key**

```bash
# Revoke API key
curl -X DELETE "http://localhost:8000/api/api-keys/{KEY_ID}?reason=Security+breach" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Response: 204 No Content
```

### **8.2 - Try Using Revoked Key**

```bash
# Attempt to use revoked key
curl -X GET "http://localhost:8000/api/v1/artists" \
  -H "X-API-Key: $API_KEY"

# Response: 401 Unauthorized
# {
#   "error": {
#     "code": "invalid_api_key",
#     "message": "Invalid or expired API key"
#   }
# }
```

### **8.3 - Check Key Status**

```bash
# View key details (should show status: revoked)
curl -X GET "http://localhost:8000/api/api-keys/{KEY_ID}" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Response includes:
# "status": "revoked",
# "revoked_at": "2025-11-03T...",
# "revoked_reason": "Security breach"
```

---

## 📈 **Step 9: Test via Swagger UI**

1. **Open** http://localhost:8000/docs
2. **Authorize** with JWT token (click lock icon at top)
3. **Expand** "api-keys" section
4. **Test endpoints**:
   - Create key
   - List keys
   - Get usage stats
   - Check rate limit
   - Revoke key

---

## 🧪 **Step 10: Verify Database**

### **Check API Keys**

```sql
-- All API keys with stats
SELECT
  name,
  key_prefix,
  rate_limit_tier,
  requests_per_hour,
  total_requests,
  current_hour_requests,
  status,
  created_at
FROM api_keys
ORDER BY created_at DESC;

-- Active keys by user
SELECT
  u.email,
  u.subscription_tier,
  COUNT(*) as active_keys,
  SUM(ak.total_requests) as total_api_requests
FROM users u
JOIN api_keys ak ON u.id = ak.user_id
WHERE ak.status = 'active'
GROUP BY u.email, u.subscription_tier;
```

### **Check Usage Logs**

```sql
-- Recent activity
SELECT
  ak.name,
  akl.endpoint,
  akl.method,
  akl.status_code,
  akl.response_time_ms,
  TO_CHAR(akl.timestamp, 'YYYY-MM-DD HH24:MI:SS') as time
FROM api_key_usage_logs akl
JOIN api_keys ak ON akl.api_key_id = ak.id
ORDER BY akl.timestamp DESC
LIMIT 50;

-- Status code distribution
SELECT
  status_code,
  COUNT(*) as count
FROM api_key_usage_logs
GROUP BY status_code
ORDER BY status_code;
```

### **Check Daily Summaries**

```sql
-- Weekly summary
SELECT
  DATE(aks.date) as day,
  SUM(aks.total_requests) as requests,
  AVG(aks.avg_response_time_ms) as avg_ms
FROM api_key_usage_summaries aks
WHERE aks.date >= NOW() - INTERVAL '7 days'
GROUP BY DATE(aks.date)
ORDER BY day DESC;
```

---

## 🧮 **Step 11: Test Advanced Scenarios**

### **Scenario 1: Multiple Keys Per User**

1. Create 3 different API keys
2. Use each for different purposes
3. Compare usage stats across keys
4. Revoke one key, verify others still work

### **Scenario 2: Rate Limit Reset**

1. Hit rate limit (100 requests for SOLO)
2. Wait until next hour starts
3. Verify requests work again
4. Check `current_hour_requests` reset to 0

### **Scenario 3: Performance Testing**

1. Generate 1,000 API requests
2. Check average response time
3. Verify all logs created correctly
4. Run daily summary calculation
5. Compare summary stats with raw logs

### **Scenario 4: Key Expiration**

1. Create key with 1-day expiration
2. Verify it works immediately
3. Manually set expiration to past
4. Run `mark_expired_keys_task()`
5. Verify key stops working
6. Check status changed to "expired"

---

## 🐛 **Troubleshooting**

### **Error: "Table api_keys does not exist"**

```bash
# Run migration
cd backend
alembic upgrade head

# Verify
alembic current
```

### **Error: "X-API-Key header not found"**

Make sure you're using `/api/v1/*` routes (not `/api/*`).

```bash
# ❌ Wrong - uses JWT auth
curl http://localhost:8000/api/artists

# ✅ Correct - uses API key auth
curl -H "X-API-Key: $API_KEY" http://localhost:8000/api/v1/artists
```

### **Rate limit not resetting**

Rate limits reset every hour from when the first request was made.

```sql
-- Check current hour start
SELECT
  name,
  current_hour_start,
  current_hour_requests,
  requests_per_hour
FROM api_keys
WHERE status = 'active';
```

### **Logs not being created**

Check middleware is registered:

```python
# In app/main.py
from app.middleware.api_key_auth import APIKeyAuthMiddleware
app.add_middleware(APIKeyAuthMiddleware)
```

---

## ✅ **Testing Checklist**

- [ ] Migration applied (005_api_keys)
- [ ] Backend starts without errors
- [ ] Swagger UI shows api-keys routes
- [ ] Can create API key via JWT auth
- [ ] API key returned in response (shown once)
- [ ] Can list user's API keys
- [ ] Can get key details
- [ ] Can check rate limit status
- [ ] Can use API key for /api/v1/* routes
- [ ] Rate limit headers in response
- [ ] Rate limiting works (429 after limit)
- [ ] Invalid key returns 401
- [ ] Missing key returns 401
- [ ] Usage logs created in database
- [ ] Can view usage statistics
- [ ] Can revoke API key
- [ ] Revoked key doesn't work
- [ ] Celery tasks run successfully:
  - [ ] Daily summaries calculation
  - [ ] Old logs cleanup
  - [ ] Expired keys marking
  - [ ] Usage alerts
- [ ] Rate limit tier matches subscription
- [ ] Upgrading subscription increases limit

---

## 📞 **Support**

If issues occur:
1. Check backend logs: `tail -f logs/backend.log`
2. Check Celery worker logs
3. Verify PostgreSQL connection
4. Check migration: `alembic current`
5. Verify middleware registered in main.py

---

## 🎉 **Success!**

If all tests pass, your **API Access System** is fully functional! 🚀

You now have:
- ✅ Secure API key generation with SHA-256 hashing
- ✅ Tier-based rate limiting (SOLO/PRO/LABEL/ENTERPRISE)
- ✅ Automatic usage tracking and logging
- ✅ Daily analytics summaries
- ✅ Key expiration and revocation
- ✅ Usage alerts and monitoring

**Next steps:**
- Integrate with frontend dashboard
- Add API documentation for external developers
- Set up monitoring and alerts
- Consider adding IP whitelisting
- Implement webhook notifications for rate limit warnings

**API Documentation**: Create public docs at `/api/v1/docs` for external developers using your API! 📚
