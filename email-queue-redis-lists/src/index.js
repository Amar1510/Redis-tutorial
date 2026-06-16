import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// A Redis List is an ordered sequence of strings. Here it acts as a job QUEUE:
// producers push jobs on one end, a worker pops them off the other end (FIFO).
const QUEUE_KEY = 'queue:emails';

// Producer: enqueue an email job.
app.post('/emails', async(req, res)=> {
    const job = {
        to: req.body.to,
        subject: req.body.subject || 'No subject',
        body: req.body.body || 'No content',
        createdAt: new Date().toISOString()
    }
    // LPUSH pushes onto the LEFT (head) of the list. Jobs are stored as JSON strings
    // since list elements are plain strings.
    await redis.lpush(QUEUE_KEY, JSON.stringify(job));
    res.json({enqueued: true, job});
})

// Consumer: process the oldest job.
app.get('/emails/process-one', async(req, res)=> {
    // RPOP pops from the RIGHT (tail). LPUSH + RPOP = FIFO: the first job pushed is
    // the first one processed. (LPUSH + LPOP would instead give LIFO / a stack.)
    const job = await redis.rpop(QUEUE_KEY);
    if (job) {
        const parsedJob = JSON.parse(job);
        console.log('Processing job:', parsedJob);
        res.json({processed: true, job: parsedJob});
    } else {
        res.json({processed: false, message: 'No jobs in queue'});
    }
})

app.listen(3000, ()=> {
    console.log("Server running on http://localhost:3000");
})
