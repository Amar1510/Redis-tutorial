# Redis TTL — Key expiry (OTP flow)

A phone **OTP (one-time password)** API that shows how Redis can expire keys
automatically. This is the classic real-world use of **TTL (time to live)**.

[← Back to main README](../README.md)

---

## What this demonstrates

How to give a key a lifetime so Redis deletes it on its own — no cron job or cleanup
code needed. Perfect for ephemeral data like OTPs, sessions, and rate-limit windows.

## Flow

- `POST /otp` — generates a 6-digit OTP and stores it with `SET key value EX 60`,
  giving the key a **60-second TTL**. Redis deletes it automatically afterward.
- `POST /otp/verify` — reads the OTP with `GET`. If it returns `null`, the key already
  expired ("OTP expired"). On a correct match it `DEL`s the key so the OTP can't be reused.
- `GET /otp/:phone/ttl` — returns the remaining lifetime with the `TTL` command.

## Key commands & concepts

- `SET key value EX <seconds>` — store a value *with* an expiry in one atomic step.
- `TTL key` — seconds remaining before expiry. Special return values:
  - `-2` → the key does not exist (already expired or never set)
  - `-1` → the key exists but has **no** expiry
- `EXPIRE key <seconds>` — add/update a TTL on an existing key (alternative to `EX`).

**Why TTL matters:** expiry is perfect for ephemeral data — OTPs, sessions, cached
results, and rate-limit windows — where data should vanish automatically instead of
being manually cleaned up.

## Key metadata (inspecting a key)

Beyond its value, Redis tracks **metadata** about every key. These commands let you
introspect a key without reading/altering its value — very handy when debugging TTL
behavior:

- `TYPE key` — the value's data type (`string`, `list`, `hash`, `set`, `zset`, `stream`).
- `PTTL key` — remaining time to live in **milliseconds** (the millisecond version of `TTL`).
- `EXPIRETIME key` / `PEXPIRETIME key` — the **absolute** Unix time (sec / ms) when the
  key will expire, rather than a countdown (Redis 7+).
- `PERSIST key` — removes the TTL, turning an expiring key into a permanent one.
- `OBJECT ENCODING key` — the internal encoding Redis chose (e.g. `int`, `embstr`, `raw`),
  useful for understanding memory/performance.
- `OBJECT IDLETIME key` — seconds since the key was last accessed.
- `MEMORY USAGE key` — approximate bytes the key occupies.

> In `redis-cli` you can quickly check expiry metadata for the OTP example with:
> `TTL otp:9876543210`, `PTTL otp:9876543210`, `PERSIST otp:9876543210`.

## API

| Method & route | Redis command | Description |
|----------------|---------------|-------------|
| `POST /otp` | `SET otp:<phone> <code> EX 60` | Generate + store an OTP for 60s |
| `POST /otp/verify` | `GET` + `DEL` | Verify, and consume on success |
| `GET /otp/:phone/ttl` | `TTL otp:<phone>` | Seconds left before the OTP expires |

## Run it

```bash
# from the repo root, make sure Redis is running:
docker run -d --name redis -p 6379:6379 redis:7

npm install
npm run dev
```

Then try:

```bash
curl -X POST localhost:3000/otp -H "Content-Type: application/json" -d '{"phoneNo":"9876543210"}'
curl localhost:3000/otp/9876543210/ttl
curl -X POST localhost:3000/otp/verify -H "Content-Type: application/json" -d '{"phoneNo":"9876543210","otp":"<code>"}'
```
