# Redis Lists — Email queue

A simple **email job queue** built on a Redis **List**. Producers enqueue email jobs;
a worker pops and processes them one at a time, in the order they arrived (FIFO).

[← Back to main README](../README.md)

---

## What is a Redis List?

A **List** is an ordered collection of strings, implemented as a linked list. You push
and pop elements from either end, which makes lists perfect for **queues** and
**stacks**.

```
LPUSH →  [ head ] job3  job2  job1 [ tail ]  ← RPUSH
RPOP/LPOP read from the ends
```

- Elements are plain **strings** (store objects as JSON, like this example does).
- Fast push/pop at both ends; indexing into the middle is slower.

## Queue patterns: FIFO vs LIFO

The combination of push/pop ends decides the ordering:

| Pattern | Push | Pop | Result |
|---------|------|-----|--------|
| **FIFO** (queue) | `LPUSH` | `RPOP` | First in, first out — *used here* |
| **FIFO** (other direction) | `RPUSH` | `LPOP` | Same effect, opposite ends |
| **LIFO** (stack) | `LPUSH` | `LPOP` | Last in, first out |

This example uses **`LPUSH` + `RPOP`**: push new jobs onto the head, process from the
tail, so the **oldest job is handled first**.

## Why a List for a queue?

- **Decoupling** — the web request just drops a job in Redis and returns immediately;
  a separate worker does the slow email sending.
- **Buffering** — bursts of requests pile up safely instead of overwhelming the sender.
- **Ordering** — jobs are processed in arrival order.

> For production-grade queues you'd typically use **blocking** pops (`BRPOP`) so the
> worker sleeps until a job arrives, instead of polling. See the commands below.

## List commands (in detail)

| Command | What it does |
|---------|--------------|
| `LPUSH key value [...]` | Push one or more values onto the **head** (left). |
| `RPUSH key value [...]` | Push onto the **tail** (right). |
| `LPOP key [count]` | Remove and return from the head. |
| `RPOP key [count]` | Remove and return from the tail. |
| `LLEN key` | Number of elements in the list. |
| `LRANGE key start stop` | Get a range of elements (`0 -1` = all). |
| `LINDEX key i` | Get the element at index `i`. |
| `LREM key count value` | Remove matching elements. |
| `LTRIM key start stop` | Keep only a range, trimming the rest (e.g. capped lists). |
| `BLPOP key [...] timeout` | **Blocking** LPOP — wait up to `timeout`s for an element. |
| `BRPOP key [...] timeout` | **Blocking** RPOP — ideal for worker loops. |

## API

| Method & route | Redis command | Description |
|----------------|---------------|-------------|
| `POST /emails` | `LPUSH queue:emails <job>` | Enqueue an email job (JSON) |
| `GET /emails/process-one` | `RPOP queue:emails` | Pop + process the oldest job |

## Run it

```bash
# from the repo root, make sure Redis is running:
docker run -d --name redis -p 6379:6379 redis:7

npm install
npm run dev
```

Then enqueue a few jobs and process them in order:

```bash
curl -X POST localhost:3000/emails -H "Content-Type: application/json" -d '{"to":"a@x.com","subject":"Hi","body":"first"}'
curl -X POST localhost:3000/emails -H "Content-Type: application/json" -d '{"to":"b@x.com","subject":"Yo","body":"second"}'

curl localhost:3000/emails/process-one   # -> first job ("first")
curl localhost:3000/emails/process-one   # -> second job ("second")
curl localhost:3000/emails/process-one   # -> queue empty
```

Inspect the queue directly in `redis-cli`:

```
LLEN queue:emails
LRANGE queue:emails 0 -1
```
