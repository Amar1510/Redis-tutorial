import Redis from 'ioredis';

// A dedicated connection for subscribing. Once a connection subscribes, it enters
// "subscriber mode" and can only run (un)subscribe-related commands — so keep the
// subscriber separate from the publisher/app connection.
const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// SUBSCRIBE channel -> start listening on a channel. The callback fires once the
// subscription is registered (or errors). Must match the publisher's channel name.
subscriber.subscribe('notifications', (err) => {
    if (err) {
        console.log("err", err);
        return;
    }
    console.log("Subscribed to 'notifications', waiting for messages...");
})

// The "message" event fires for every message published to a subscribed channel,
// giving you the channel name and the raw message string.
subscriber.on("message", (channel, message) => {
    console.log("Received On", channel, ":", JSON.parse(message));
})
