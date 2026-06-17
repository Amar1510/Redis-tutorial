# Redis Pub/Sub — Notifications

A minimal **publish/subscribe** example: an Express API publishes notification messages
to a channel, and a separate subscriber process receives them in real time.

[← Back to main README](../README.md)

---

## What is Pub/Sub?

**Pub/Sub (publish/subscribe)** is a messaging pattern where senders (**publishers**)
don't send messages to specific receivers. Instead they publish to a named **channel**,
and any number of **subscribers** listening on that channel receive a copy.

- Publishers and subscribers are **decoupled** — they don't know about each other.
- Delivery is **fire-and-forget**: messages are pushed to whoever is connected *right
  now*. Redis does **not** store them. If nobody is subscribed, the message is **lost**.
- It's **at-most-once** delivery — no acknowledgements, no replay. (If you need
  persistence/replay, use a **Redis Stream** instead.)

## Visual model — active vs inactive channel

A publisher sends to a channel; Redis fans the message out to every current subscriber
of that channel. A channel with no subscribers simply drops the message.

```
                          ┌──────────────────────────────────────────┐
                          │                 REDIS                     │
                          │                                            │
   PUBLISHER ──PUBLISH──▶ │  channel: "notifications"  (ACTIVE)        │
   (api.js)               │     2 subscribers ──┐                      │
                          │                     ├──▶ Subscriber A  ✅  │
                          │                     └──▶ Subscriber B  ✅  │
                          │                                            │
   PUBLISHER ──PUBLISH──▶ │  channel: "sports"  (INACTIVE)             │
                          │     0 subscribers ──▶ (message discarded) ❌│
                          └──────────────────────────────────────────┘

ACTIVE channel   → has ≥1 subscriber → message delivered to all of them.
                   PUBLISH returns the subscriber count (e.g. 2).
INACTIVE channel → has 0 subscribers → message is dropped, nothing stored.
                   PUBLISH returns 0.
```

That return value (the subscriber count) is your signal for whether anyone actually
received the message.

## How this example is wired

Two processes, two Redis connections:

- **`api.js`** — the **publisher**. `POST /notifications` builds a payload and calls
  `PUBLISH notifications <json>`.
- **`subscriber.js`** — the **subscriber**. It calls `SUBSCRIBE notifications` and logs
  every message it receives.

> Why two connections? A connection that subscribes enters **"subscriber mode"** and
> can no longer issue normal commands. So publishing and subscribing must use separate
> clients — hence the separate file.

## Pub/Sub commands

| Command | What it does |
|---------|--------------|
| `PUBLISH channel message` | Send a message to a channel. Returns # of subscribers that got it. |
| `SUBSCRIBE channel [...]` | Listen on one or more channels. |
| `UNSUBSCRIBE [channel ...]` | Stop listening (all channels if none given). |
| `PSUBSCRIBE pattern` | Subscribe by pattern, e.g. `news.*` matches `news.sports`, `news.tech`. |
| `PUNSUBSCRIBE [pattern]` | Unsubscribe from a pattern. |
| `PUBSUB CHANNELS [pattern]` | List currently active channels (those with subscribers). |
| `PUBSUB NUMSUB [channel ...]` | Subscriber count per channel. |

## Run it

You need **two terminals** (Redis must be running — `docker run -d --name redis -p 6379:6379 redis:7`):

```bash
npm install

# Terminal 1 — start the subscriber (listens for messages)
node src/subscriber.js

# Terminal 2 — start the publisher API
npm run dev
```

Then publish a notification and watch it appear in Terminal 1:

```bash
curl -X POST localhost:3000/notifications -H "Content-Type: application/json" -d '{"title":"Hello Pub/Sub"}'
# response: {"success":true,"receivers":1}   <- 1 subscriber received it
```

Try it with the subscriber **stopped**: `receivers` comes back as `0` and the message
is gone — demonstrating the inactive-channel case above.

You can also subscribe straight from `redis-cli`:

```
SUBSCRIBE notifications
```
