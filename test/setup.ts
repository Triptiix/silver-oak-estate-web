import "@testing-library/jest-dom";

process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "dummy-anon-key";
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "dummy-turnstile-key";
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_dummy";
process.env.ONLINE_BOOKING_ENABLED = "true";
process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy";
process.env.RAZORPAY_KEY_SECRET = "private-payment-secret";
process.env.PAYMENT_WEBHOOK_SECRET = "dummy";
process.env.PAYMENT_MODE = "test";
process.env.TURNSTILE_SECRET_KEY = "dummy";
process.env.BOOKING_TOKEN_SECRET = "dummy";
process.env.ICAL_FEED_SECRET = "dummy";
process.env.EMAIL_API_KEY = "dummy";
process.env.EMAIL_SENDER = "test@example.com";
process.env.ADMIN_NOTIFICATION_RECIPIENTS = "admin@example.com";
process.env.CRON_SECRET = "dummy";
