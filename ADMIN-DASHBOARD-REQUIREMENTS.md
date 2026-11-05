# Admin dashboard – backend work required

The supplied API exposes conversion endpoints only; it has no admin authentication, users, usage metrics, configuration, or moderation routes. A static admin screen would not be secure and would not be able to manage real data.

Before building the dashboard, implement server-side authentication (secure HttpOnly session cookies, CSRF protection, rate limiting, password hashing, optional MFA) and role-protected endpoints for aggregate usage, conversion failures, quota/rate-limit settings, and operational health. Do not expose API secrets or raw uploaded files in the dashboard.
