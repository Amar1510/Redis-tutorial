# Redis JSON-string vs Hash

Two ways to store a structured object (a **user**) in Redis, side by side:

1. **JSON string** — serialize the whole object and store it under one key (`SET`/`GET`).
2. **Hash** — store each property as its own field inside a single key (`HSET`/`HGETALL`).

[← Back to main README](../README.md)

---

## What is a Redis Hash?

A **Hash** is a Redis value type that maps **fields → values** inside a single key —
essentially a small dictionary/object stored under one key:

```
user:1:hash
├── name  → "Amar"
├── age   → "30"
└── city  → "Pune"
```

This is ideal for representing objects/records (a user, a product, a config). Instead
of one opaque blob, each attribute is individually addressable.

> Note: hash field values are **always strings**. A number like `30` is stored and
> returned as `"30"` — convert in your app if you need a real number.

## JSON string vs Hash — trade-offs

| | JSON string (`SET`/`GET`) | Hash (`HSET`/`HGETALL`) |
|---|---|---|
| Update one field | Read blob → parse → edit → re-serialize → write | `HSET key field value` directly |
| Read one field | Must fetch + parse whole blob | `HGET key field` only |
| Partial reads | No | Yes (`HMGET`) |
| Nested/complex data | Easy (arbitrary JSON) | Flat only (no nested objects) |
| Atomic field increment | No | Yes (`HINCRBY`) |
| Memory | One string | Optimized for small hashes |

**Rule of thumb:** use a **hash** for flat records you update field-by-field; use a
**JSON string** when the object is read/written as a whole or has nested structure.

## Hash commands (in detail)

| Command | What it does |
|---------|--------------|
| `HSET key field value [field value ...]` | Set one or more fields. Returns count of **new** fields added. |
| `HGET key field` | Get a single field's value (`nil` if missing). |
| `HGETALL key` | Get all fields and values as pairs. |
| `HMGET key f1 f2 ...` | Get multiple specific fields at once. |
| `HDEL key field [field ...]` | Delete one or more fields. |
| `HEXISTS key field` | `1` if the field exists, else `0`. |
| `HKEYS key` | List all field names. |
| `HVALS key` | List all values. |
| `HLEN key` | Number of fields in the hash. |
| `HINCRBY key field n` | Atomically add `n` to a numeric field (e.g. counters). |
| `HINCRBYFLOAT key field n` | Same, for floats. |
| `HSETNX key field value` | Set a field only if it doesn't already exist. |

> Older code may use `HMSET` to set multiple fields — it's **deprecated**; `HSET`
> now accepts multiple field/value pairs, so use `HSET`.

## API

| Method & route | Redis command | Description |
|----------------|---------------|-------------|
| `POST /user/:id/json` | `SET user:<id>:json <blob>` | Store a user as a JSON string |
| `GET /user/:id/json` | `GET user:<id>:json` | Read + parse the JSON user |
| `POST /user/:id/hash` | `HSET user:<id>:hash ...` | Store a user as a hash |
| `GET /user/:id/hash` | `HGETALL user:<id>:hash` | Read the whole hash back |

## Run it

```bash
# from the repo root, make sure Redis is running:
docker run -d --name redis -p 6379:6379 redis:7

npm install
npm run dev
```

Then try both styles and compare:

```bash
# JSON-string style
curl -X POST localhost:3000/user/1/json -H "Content-Type: application/json" -d '{"name":"Amar","age":30,"city":"Pune"}'
curl localhost:3000/user/1/json

# Hash style
curl -X POST localhost:3000/user/1/hash -H "Content-Type: application/json" -d '{"name":"Amar","age":30,"city":"Pune"}'
curl localhost:3000/user/1/hash
```

Inspect the hash directly in `redis-cli` to see the field structure:

```
HGETALL user:1:hash
HGET user:1:hash name
HKEYS user:1:hash
```
