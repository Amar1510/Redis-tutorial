import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json())

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Redis keys are flat strings. The convention is a colon-separated namespace
// (object:id:field) so related keys stay grouped, e.g. "app:banner".
const BANNER_KEY = "app:banner";

// SET key value  -> stores (or overwrites) a String value at the key.
app.post("/banner", async (req, res) => {
    await redis.set(BANNER_KEY, req.body.banner || "Welcome to redis");
    res.json({success: true});
});


// GET key  -> reads the String value back (null if the key doesn't exist).
app.get("/banner", async (req, res) => {
    const message = await redis.get(BANNER_KEY);
    res.json({message})
});

// DEL key  -> deletes the key. Returns the number of keys removed.
app.delete("/banner", async (req, res ) => {
    await redis.del(BANNER_KEY);
    res.json({success: true});
});

// EXISTS key  -> returns 1 if the key exists, 0 if it doesn't.
app.get("/banner/exists", async (req, res) => {
    const exists = await redis.exists(BANNER_KEY);
    res.json({exists: exists});
});

app.listen(3000, ()=> {
    console.log("Server running on http://localhost:3000");
})
