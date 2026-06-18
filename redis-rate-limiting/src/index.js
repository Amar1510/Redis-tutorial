import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// --- Fixed-window rate limit config ---
const MAX_REQUESTS = 5;   // allowed requests...
const WINDOW_SECONDS = 60; // ...per this many seconds, per client.

// Fixed-window rate limiter using INCR + EXPIRE.
//
// Idea: keep a per-client counter that resets every window. Each request increments
// it; once it crosses the limit within the window, further requests are rejected.
async function rateLimiter(req, res, next) {
    // One counter key per client per window. Using the IP here; in real apps you'd
    // usually key by user/API token. e.g. "rate:limit:127.0.0.1"
    const key = `rate:limit:${req.ip}`;

    // INCR creates the key at 1 on the first request, then increments atomically.
    // Atomicity matters: concurrent requests can't both "miss" the limit.
    const current = await redis.incr(key);

    // Only the FIRST request in a window sets the expiry. After WINDOW_SECONDS the key
    // disappears and the next request starts a fresh window back at 1.
    if (current === 1) {
        await redis.expire(key, WINDOW_SECONDS);
    }

    // TTL tells the client how long until the window resets.
    const ttl = await redis.ttl(key);

    // Expose standard-ish rate-limit headers.
    res.set('X-RateLimit-Limit', MAX_REQUESTS);
    res.set('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - current));

    if (current > MAX_REQUESTS) {
        // 429 = Too Many Requests. Retry-After hints when to try again.
        res.set('Retry-After', ttl);
        return res.status(429).json({
            error: 'Too many requests',
            retryAfter: ttl,
        });
    }

    next();
}

// Apply the limiter to this route (could also be app.use(rateLimiter) for all routes).
app.get('/api/data', rateLimiter, (req, res) => {
    res.json({ data: 'Here is your data', at: new Date().toISOString() });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
