# Redis Rate Limiting

A simple **API rate limiter** built with Redis — limit each client to *N* requests per
time window. This example uses the **fixed-window counter** approach with `INCR` +
`EXPIRE`, applied as Express middleware.

[← Back to main README](../README.md)

---

## Why rate limit?

Rate limiting protects an API from abuse, runaway clients, and accidental overload by
capping how many requests a client can make in a given period. Redis is ideal for this:
it's fast, shared across all your server instances, and has atomic counters with
built-in expiry.

## The fixed-window algorithm

Keep one counter per client that lives for the length of the window:

1. On each request, `INCR rate:limit:<client>` — creates the key at `1`, then counts up.
2. On the **first** request of a window (`count === 1`), set `EXPIRE` for the window length.
3. If the counter exceeds the limit, reject with **HTTP 429**; otherwise allow it.
4. When the key expires, the next request starts a fresh window at `1`.

```
limit = 5 requests / 60s          key: rate:limit:127.0.0.1

req 1  INCR -> 1   (EXPIRE 60s set)   allow   remaining 4
req 2  INCR -> 2                      allow   remaining 3
req 3  INCR -> 3                      allow   remaining 2
req 4  INCR -> 4                      allow   remaining 1
req 5  INCR -> 5                      allow   remaining 0
req 6  INCR -> 6  > limit             429 Too Many Requests (Retry-After = TTL)
 ...   (key expires after 60s) ...
req 7  INCR -> 1   (new window)       allow   remaining 4
```

**Why `INCR` is the right tool:** it's **atomic**, so even if many requests arrive at
once, each gets a distinct count — no two requests can both slip past the limit due to
a read/modify/write race.

### Trade-off (the "window edge" burst)

Fixed windows are simple but allow up to *2×* the limit around a boundary: a client
could send 5 requests at `0:59` and 5 more at `1:01`. If you need smoother limiting,
use one of these instead:

- **Sliding window log / counter** — track timestamps (e.g. a sorted set with `ZADD` +
  `ZREMRANGEBYSCORE`) for a rolling window.
- **Token bucket** — refill tokens at a fixed rate; allows controlled bursts.

## Commands used

| Command | What it does |
|---------|--------------|
| `INCR key` | Atomically increment (creates key at `1` if absent) | 
| `EXPIRE key <seconds>` | Set the window's TTL (only on the first request) |
| `TTL key` | Seconds left in the window — used for the `Retry-After` header |

## Response headers

| Header | Meaning |
|--------|---------|
| `X-RateLimit-Limit` | Max requests allowed per window |
| `X-RateLimit-Remaining` | Requests left in the current window |
| `Retry-After` | Seconds until the window resets (sent on 429) |

## Run it

```bash
# from the repo root, make sure Redis is running:
docker run -d --name redis -p 6379:6379 redis:7

npm install
npm run dev
```

Hammer the endpoint to trip the limit (6th request within 60s returns 429):

```bash
for i in $(seq 1 7); do
  echo "Request $i:"
  curl -s -i localhost:3000/api/data | grep -E "HTTP|X-RateLimit-Remaining|Retry-After"
  echo
done
```

Inspect the counter live in `redis-cli`:

```
GET rate:limit:127.0.0.1     # current count
TTL rate:limit:127.0.0.1     # seconds until the window resets
```
