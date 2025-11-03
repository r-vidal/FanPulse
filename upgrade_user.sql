-- Upgrade user to PRO tier and verify email
-- Replace 'test@fanpulse.com' with your email

UPDATE users
SET
  subscription_tier = 'pro',
  is_verified = true
WHERE email = 'test@fanpulse.com';

-- Check the result
SELECT id, email, subscription_tier, is_verified, created_at
FROM users
WHERE email = 'test@fanpulse.com';
