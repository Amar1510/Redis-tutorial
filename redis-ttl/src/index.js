import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Namespaced key per phone number, e.g. "otp:9876543210".
function otpKey(phoneNo) {
    return `otp:${phoneNo}`;
}

app.post('/otp', async(req, res) => {
    const {phoneNo} = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // SET key value EX 60  -> stores the OTP with a 60-second TTL.
    // Redis auto-deletes the key after 60s, so the OTP "expires" with no cron/cleanup code.
    await redis.set(otpKey(phoneNo), otp, 'EX', 60);
    return res.send({message: "OTP sent", otp});
});

app.post('/otp/verify', async(req, res) => {
    const {phoneNo, otp } = req.body;
    const savedOtp = await redis.get(otpKey(phoneNo));
    // GET returns null once the key has expired -> treat as an expired OTP.
    if(!savedOtp){
        res.send("OTP expired");
        return;
    }
    if(savedOtp !== otp ){
        return res.send("Invalid OTP");
    }
    // DEL on success so a valid OTP can't be reused (one-time use).
    await redis.del(otpKey(phoneNo));
    return res.send("OTP verified");
})

app.get('/otp/:phone/ttl', async (req,res)=> {
    // TTL key -> seconds left before expiry.
    // Special values: -2 = key doesn't exist, -1 = key exists but has no expiry set.
    const ttl = await redis.ttl(otpKey(req.params.phone));
    return res.json({ttl});
})

app.listen(3000, ()=> {
    console.log("Server running on http://localhost:3000");
})
