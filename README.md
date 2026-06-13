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

## Repo structure

Each folder is one self-contained topic. As I add topics, they'll be listed here.

| Topic | Folder | What it demonstrates |
|-------|--------|----------------------|
| Redis basics: storing a value | [`redis-basics-site-banner`](./redis-basics-site-banner) | `SET` / `GET` / `DEL` / `EXISTS` on a string key via an Express API |

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
