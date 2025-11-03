-- Create user directly in database
-- Password hash for "Password123!" using bcrypt

INSERT INTO users (
  id,
  email,
  hashed_password,
  subscription_tier,
  is_verified,
  created_at
) VALUES (
  gen_random_uuid(),
  'test@fanpulse.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ND8x/QAYH1K.', -- Password123!
  'pro',
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  subscription_tier = 'pro',
  is_verified = true;

-- Verify the user was created
SELECT id, email, subscription_tier, is_verified
FROM users
WHERE email = 'test@fanpulse.com';
