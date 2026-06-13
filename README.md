# Redis Tutorial

A hands-on learning repo for Redis. Each topic I learn lives in its own folder with
a small, runnable example. This README grows over time — a shared "notes" file that
explains the concepts behind each example.

---

## What is Redis?

**Redis** (REmote DIctionary Server) is an open-source, **in-memory** data store. It
keeps data in RAM (instead of on disk like a traditional database), which makes reads
and writes extremely fast — typically sub-millisecond.

At its core, Redis is a **key → value** store, but the values can be rich data
structures (strings, lists, hashes, sets, sorted sets, streams, and more), which makes
it far more powerful than a plain cache.

### Why use Redis?

- **Speed** — in-memory means microsecond/millisecond latency.
- **Versatility** — works as a cache, database, message broker, and queue.
- **Simplicity** — a small, predictable command set.
- **Built-in expiry (TTL)** — keys can auto-delete after a set time, perfect for
  caching and sessions.
- **Atomic operations** — commands run one-at-a-time, avoiding race conditions.

### When NOT to use it

- As your only store for large data that must survive crashes (RAM is limited and
  volatile — though Redis does offer persistence options like RDB/AOF).
- For complex relational queries / joins — use a SQL database for that.

---

## Core data types

| Type | Description | Example use |
|------|-------------|-------------|
| **String** | Simple key → value (text, numbers, JSON) | Cache a value, counters, feature flags |
| **Hash** | Key → field/value map (like an object) | Store a user profile under one key |
| **List** | Ordered collection (linked list) | Queues, recent activity feeds |
| **Set** | Unordered unique values | Tags, unique visitors |
| **Sorted Set** | Set ordered by a score | Leaderboards, rate limiting |
| **Stream** | Append-only log | Event sourcing, messaging |

---

## Common usage patterns

- **Caching** — store the result of a slow query/API and serve it fast. Pair with a
  **TTL** so stale data expires automatically.
- **Session store** — keep user sessions in Redis so any server instance can read them.
- **Rate limiting** — count requests per user/IP within a time window (using `INCR` + `EXPIRE`).
- **Pub/Sub & queues** — push jobs/messages between services.
- **Leaderboards / counters** — atomic `INCR` and sorted sets for rankings.

### Key naming convention

Redis keys are flat strings, so a colon-separated namespace is the community standard:

```
object-type:id:field   →   user:42:email,  app:banner,  cart:1001:items
```

This keeps keys organized and makes them easy to scan/group.

---

## Redis command reference

A running cheat-sheet of every command used across the topics in this repo. New
commands get added here as each topic is created.

### Strings

| Command | What it does | Topic |
|---------|--------------|-------|
| `SET key value` | Store/overwrite a string value | `redis-basics-site-banner` |
| `GET key` | Read a string value (`null` if missing) | `redis-basics-site-banner` |
| `SET key value EX <s>` | Store a value with an expiry (TTL) in one step | `redis-ttl` |

### Keys / generic

| Command | What it does | Topic |
|---------|--------------|-------|
| `DEL key` | Delete a key; returns how many were removed | `redis-basics-site-banner` |
| `EXISTS key` | `1` if the key exists, else `0` | `redis-basics-site-banner` |
| `TYPE key` | The key's data type | `redis-ttl` |

### Expiry / TTL

| Command | What it does | Topic |
|---------|--------------|-------|
| `TTL key` | Seconds left before expiry (`-1` no expiry, `-2` no key) | `redis-ttl` |
| `PTTL key` | Same as `TTL` but in milliseconds | `redis-ttl` |
| `EXPIRE key <s>` | Set/refresh a TTL on an existing key | `redis-ttl` |
| `EXPIRETIME key` | Absolute Unix time (sec) when the key expires (Redis 7+) | `redis-ttl` |
| `PERSIST key` | Remove the TTL (make the key permanent) | `redis-ttl` |

### Introspection / metadata

| Command | What it does | Topic |
|---------|--------------|-------|
| `OBJECT ENCODING key` | Internal encoding (`int`, `embstr`, `raw`, …) | `redis-ttl` |
| `OBJECT IDLETIME key` | Seconds since the key was last accessed | `redis-ttl` |
| `MEMORY USAGE key` | Approximate bytes used by the key | `redis-ttl` |

---

## Repo structure

Each folder is one self-contained topic. As I add topics, they'll be listed here.

| Topic | Folder | What it demonstrates |
|-------|--------|----------------------|
| Redis basics: storing a value | [`redis-basics-site-banner`](./redis-basics-site-banner) | `SET` / `GET` / `DEL` / `EXISTS` on a string key via an Express API |
| TTL & key expiry (OTP flow) | [`redis-ttl`](./redis-ttl) | `SET ... EX`, `TTL`, and auto-expiring keys via a phone-OTP example |

### Running an example

Most examples assume a local Redis. The quickest way is Docker:

```bash
docker run -d --name redis -p 6379:6379 redis:7
```

Then inside a topic folder:

```bash
npm install
npm run dev
```

---

## Topic notes

### 1. `redis-basics-site-banner` — String basics

A tiny Express API that stores a site banner message in a single Redis **string** key
(`app:banner`). It covers the four most fundamental string commands:

- `SET key value` — store/overwrite a value
- `GET key` — read a value
- `DEL key` — delete a key
- `EXISTS key` — check if a key exists (returns `1` / `0`)

Uses [`ioredis`](https://github.com/redis/ioredis) as the client. The client connects
automatically when constructed with a connection URL.

### 2. `redis-ttl` — TTL & key expiry

A phone **OTP (one-time password)** API that shows how Redis can expire keys
automatically. This is the classic real-world use of **TTL (time to live)**.

Flow:

- `POST /otp` — generates a 6-digit OTP and stores it with `SET key value EX 60`,
  giving the key a **60-second TTL**. Redis deletes it on its own afterward — no
  cleanup job needed.
- `POST /otp/verify` — reads the OTP with `GET`. If it returns `null`, the key already
  expired ("OTP expired"). On a correct match it `DEL`s the key so the OTP can't be
  reused.
- `GET /otp/:phone/ttl` — returns the remaining lifetime with the `TTL` command.

**Key commands & concepts:**

- `SET key value EX <seconds>` — store a value *with* an expiry in one atomic step.
- `TTL key` — seconds remaining before expiry. Watch the special return values:
  - `-2` → the key does not exist (already expired or never set)
  - `-1` → the key exists but has **no** expiry
- `EXPIRE key <seconds>` — add/update a TTL on an existing key (alternative to `EX`).

**Why TTL matters:** expiry is perfect for ephemeral data — OTPs, sessions, cached
results, and rate-limit windows — where data should vanish automatically instead of
being manually cleaned up.

#### Key metadata (inspecting a key)

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
