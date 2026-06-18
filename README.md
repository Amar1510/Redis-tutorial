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

## Repo structure

Each folder is one self-contained topic with its own README. Click a topic below to
read its full explanation.

| Topic | What it demonstrates |
|-------|----------------------|
| [Redis basics: storing a value](./redis-basics-site-banner) | `SET` / `GET` / `DEL` / `EXISTS` on a string key via an Express API |
| [TTL & key expiry (OTP flow)](./redis-ttl) | `SET ... EX`, `TTL`, and auto-expiring keys via a phone-OTP example |
| [JSON-string vs Hash](./redis-json-vs-hash) | Storing an object as a JSON blob vs a Redis hash (`HSET` / `HGETALL`) |
| [Email queue (Lists)](./email-queue-redis-lists) | A FIFO job queue using Redis lists (`LPUSH` / `RPOP`) |
| [Pub/Sub notifications](./redis-pub-sub) | Real-time messaging with `PUBLISH` / `SUBSCRIBE` (publisher + subscriber) |
| [Rate limiting](./redis-rate-limiting) | Fixed-window API rate limiter using `INCR` + `EXPIRE` |

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

### Hashes

| Command | What it does | Topic |
|---------|--------------|-------|
| `HSET key field value [...]` | Set one or more fields of a hash | `redis-json-vs-hash` |
| `HGET key field` | Get a single field's value | `redis-json-vs-hash` |
| `HGETALL key` | Get all fields and values | `redis-json-vs-hash` |
| `HMGET key f1 f2 ...` | Get multiple specific fields | `redis-json-vs-hash` |
| `HDEL key field [...]` | Delete fields from a hash | `redis-json-vs-hash` |
| `HEXISTS key field` | `1` if the field exists, else `0` | `redis-json-vs-hash` |
| `HKEYS key` / `HVALS key` | List all field names / values | `redis-json-vs-hash` |
| `HLEN key` | Number of fields in the hash | `redis-json-vs-hash` |
| `HINCRBY key field n` | Atomically add `n` to a numeric field | `redis-json-vs-hash` |

### Lists

| Command | What it does | Topic |
|---------|--------------|-------|
| `LPUSH key value [...]` | Push value(s) onto the head (left) | `email-queue-redis-lists` |
| `RPUSH key value [...]` | Push value(s) onto the tail (right) | `email-queue-redis-lists` |
| `LPOP key` / `RPOP key` | Pop from the head / tail | `email-queue-redis-lists` |
| `LLEN key` | Number of elements in the list | `email-queue-redis-lists` |
| `LRANGE key start stop` | Read a range (`0 -1` = all) | `email-queue-redis-lists` |
| `BRPOP key [...] timeout` | Blocking pop — wait for an element (worker loops) | `email-queue-redis-lists` |

### Pub/Sub

| Command | What it does | Topic |
|---------|--------------|-------|
| `PUBLISH channel message` | Send a message; returns # of subscribers reached | `redis-pub-sub` |
| `SUBSCRIBE channel [...]` | Listen on one or more channels | `redis-pub-sub` |
| `PSUBSCRIBE pattern` | Subscribe by pattern (e.g. `news.*`) | `redis-pub-sub` |
| `PUBSUB CHANNELS [pattern]` | List currently active channels | `redis-pub-sub` |
| `PUBSUB NUMSUB [channel ...]` | Subscriber count per channel | `redis-pub-sub` |

### Counters / atomic numbers

| Command | What it does | Topic |
|---------|--------------|-------|
| `INCR key` | Atomically increment (creates key at `1` if absent) | `redis-rate-limiting` |
| `DECR key` | Atomically decrement | `redis-rate-limiting` |
| `INCRBY key n` | Increment by `n` | `redis-rate-limiting` |

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

## Terminal / `redis-cli` cheat-sheet

`redis-cli` is the command-line client for talking to a Redis server directly — great
for inspecting keys while experimenting with these examples.

### Connecting

| Command | What it does |
|---------|--------------|
| `redis-cli` | Connect to a local server on the default port (6379) |
| `redis-cli -h <host> -p <port>` | Connect to a specific host/port |
| `redis-cli -n 2` | Use database number 2 (Redis has 16 DBs: 0–15) |
| `redis-cli -a <password>` | Authenticate with a password |
| `redis-cli ping` | Health check — replies `PONG` if the server is up |

When Redis runs in **Docker** (as in this repo), open a CLI inside the container:

```bash
docker exec -it redis redis-cli
```

### Exploring keys

| Command | What it does |
|---------|--------------|
| `KEYS *` | List all keys (⚠️ blocks the server on big datasets — dev only) |
| `SCAN 0 MATCH user:* COUNT 100` | Cursor-based, non-blocking key scan (production-safe) |
| `DBSIZE` | Number of keys in the current DB |
| `TYPE <key>` | Data type of a key (`string`, `list`, `hash`, …) |
| `TTL <key>` / `PTTL <key>` | Time to live in seconds / milliseconds |
| `RANDOMKEY` | Return a random key |

### Inspecting / debugging

| Command | What it does |
|---------|--------------|
| `MONITOR` | Live-stream every command the server receives (great for debugging) |
| `INFO` | Server stats (memory, clients, persistence, …) |
| `INFO keyspace` | Per-database key counts |
| `CLIENT LIST` | Show connected clients |
| `SLOWLOG GET` | Recent slow commands |

### Server / data management

| Command | What it does |
|---------|--------------|
| `SELECT <n>` | Switch to database number `n` |
| `FLUSHDB` | Delete all keys in the **current** DB (⚠️ destructive) |
| `FLUSHALL` | Delete all keys in **all** DBs (⚠️ destructive) |
| `SAVE` / `BGSAVE` | Snapshot data to disk (sync / background) |
| `CONFIG GET <param>` | Read a config value, e.g. `CONFIG GET maxmemory` |

### Running commands without an interactive session

```bash
# pass a command straight from your shell
redis-cli set greeting "hello"
redis-cli get greeting

# inside the Docker container
docker exec -it redis redis-cli LRANGE queue:emails 0 -1
```
