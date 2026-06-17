import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

// The PUBLISHER connection. A normal Redis client can publish freely.
// (Note: a connection used to SUBSCRIBE goes into "subscriber mode" and can't run
// normal commands — that's why the subscriber lives in its own file/connection.)
const publisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Channel name that publishers and subscribers agree on. Both sides must use the
// same string for messages to flow.
const CHANNEL = 'notifications';

app.post('/notifications', async (req, res) => {
    const payload = {
        title: req.body.title || "Default Title",
        createdAt: new Date().toISOString(),
    }
    // PUBLISH channel message -> sends the message to the channel.
    // Returns the number of subscribers that received it (0 if nobody is listening).
    // Pub/Sub is fire-and-forget: if there are no subscribers, the message is dropped.
    const receivers = await publisher.publish(CHANNEL, JSON.stringify(payload));
    res.json({success: true, receivers});
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
