# Redis basics — Site banner (String basics)

A tiny Express API that stores a site banner message in a single Redis **string** key
(`app:banner`). It covers the four most fundamental string/key commands.

[← Back to main README](../README.md)

---

## What this demonstrates

| Command | What it does |
|---------|--------------|
| `SET key value` | Store/overwrite a value |
| `GET key` | Read a value (`null` if missing) |
| `DEL key` | Delete a key |
| `EXISTS key` | Check if a key exists (returns `1` / `0`) |

The string is the simplest Redis data type — a key mapped to a single value (text,
number, or JSON). It's the foundation for caching, counters, and feature flags.

## Key naming

Uses the `app:banner` key, following the colon-namespaced convention
(`object-type:id:field`) so related keys stay grouped.

## Client

Uses [`ioredis`](https://github.com/redis/ioredis). The client connects automatically
when constructed with a connection URL — no explicit `connect()` needed.

## API

| Method & route | Redis command | Description |
|----------------|---------------|-------------|
| `POST /banner` | `SET app:banner <value>` | Store a banner message |
| `GET /banner` | `GET app:banner` | Read the current banner |
| `DELETE /banner` | `DEL app:banner` | Remove the banner |
| `GET /banner/exists` | `EXISTS app:banner` | Check if a banner is set |

## Run it

```bash
# from the repo root, make sure Redis is running:
docker run -d --name redis -p 6379:6379 redis:7

npm install
npm run dev
```

Then try:

```bash
curl -X POST localhost:3000/banner -H "Content-Type: application/json" -d '{"banner":"Hello"}'
curl localhost:3000/banner
curl localhost:3000/banner/exists
curl -X DELETE localhost:3000/banner
```
