import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json())

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// This topic compares two ways to store an object (a user) in Redis:
//   1. As a JSON string  -> SET / GET  (whole blob, parsed in the app)
//   2. As a Hash         -> HSET / HGETALL (field-per-attribute, native to Redis)

// --- Approach 1: store the object as a single JSON string ---

// SET key value -> we serialize the whole object to a JSON string first.
// Trade-off: simple, but you must read+parse the ENTIRE blob to touch one field.
app.post("/user/:id/json", async(req, res)=>{
    await redis.set(`user:${req.params.id}:json`, JSON.stringify(req.body));
    res.json({savedAs: "json"});
});

// GET key -> returns the raw string; parse it back into an object (null if missing).
app.get("/user/:id/json", async(req, res) => {
    const raw = await redis.get(`user:${req.params.id}:json`);
    res.json({user: raw ? JSON.parse(raw) : null});
})

// --- Approach 2: store the object as a Redis Hash ---

// HSET key field value [field value ...] -> stores each property as its own field.
// ioredis accepts an object, so { name, age } becomes two hash fields.
// Trade-off: can read/update a single field without touching the rest.
app.post("/user/:id/hash", async(req, res)=>{
    await redis.hset(`user:${req.params.id}:hash`, req.body);
    res.json({savedAs: "hash"});
});

// HGETALL key -> returns every field/value as an object.
// Note: hash values are always strings (e.g. age comes back as "30", not 30).
app.get("/user/:id/hash", async(req, res) => {
    const user = await redis.hgetall(`user:${req.params.id}:hash`);
    res.json(user);
})

app.listen(3000, ()=> {
    console.log("Server running on http://localhost:3000");
});
