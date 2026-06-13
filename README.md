# Redis Tutorial

A hands-on learning repo for Redis. Each topic I learn lives in its own folder with
a small, runnable example **and its own README** explaining the concepts. This root
README holds the shared fundamentals and a consolidated command reference; click any
topic in [Repo structure](#repo-structure) to read its details.

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

Each folder is one self-contained topic with its own README. Click a topic below to
read its full explanation.

| Topic | What it demonstrates |
|-------|----------------------|
| [Redis basics: storing a value](./redis-basics-site-banner) | `SET` / `GET` / `DEL` / `EXISTS` on a string key via an Express API |
| [TTL & key expiry (OTP flow)](./redis-ttl) | `SET ... EX`, `TTL`, and auto-expiring keys via a phone-OTP example |

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
