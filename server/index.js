// file to connect to redis and postgres //
const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors()); // to allow cross-origin requests from different domains
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));
pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => console.log(err));


// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    // v4 expects socket options (or url). use keys from your compose/k8s service (e.g. "redis")
    socket: {
        host: keys.redisHost,
        port: keys.redisPort
    }
});

// ensure publisher variable is available to the route handlers
let redisPublisher;

// helper to connect with retries (won't exit the process if Redis is down)
async function connectRedisWithRetry() {
    const retryDelayMs = 3000;
    const maxAttempts = parseInt(process.env.REDIS_CONNECT_RETRIES || '0', 10); // 0 = infinite
    let attempt = 0;

    while (true) {
        try {
            await redisClient.connect();
            console.log('Connected to Redis');
            break;
        } catch (err) {
            attempt++;
            console.error('Failed to connect redisClient', err);
            if (maxAttempts > 0 && attempt >= maxAttempts) {
                console.error('Max Redis connect attempts reached, continuing without Redis');
                break;
            }
            console.log(`Retrying Redis connection in ${retryDelayMs / 1000}s (attempt ${attempt})`);
            await new Promise(res => setTimeout(res, retryDelayMs));
        }
    }
}

// Express route handlers
app.get('/api', (req, res) => {
    res.send('Hi');
});

app.get('/api/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM values');
    res.send(values.rows);
});

app.get('/api/values/current', async (req, res) => {
    try {
        if (!redisClient.isOpen) {
            // Redis not connected — return empty object rather than crashing frontend
            return res.send({});
        }
        // v4 API: hGetAll returns an object
        const values = await redisClient.hGetAll('values');
        res.send(values);
    } catch (err) {
        console.error('Error fetching current values from Redis', err);
        res.status(500).send({ error: 'Redis error' });
    }
});

app.post('/api/values', async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high');
    }

    try {
        if (redisClient.isOpen) {
            // v4 API uses async/await
            await redisClient.hSet('values', index, 'Nothing yet!');
        } else {
            console.error('Redis not connected; skipping hSet');
        }

        if (!redisPublisher || !redisPublisher.isOpen) {
            console.error('Redis publisher not initialized or not connected');
        } else {
            await redisPublisher.publish('insert', index);
        }
    } catch (err) {
        console.error('Redis publish/hSet error', err);
        return res.status(500).send({ error: 'Redis error' });
    }

    // insert into Postgres (fire-and-forget is fine here)
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]).catch(err => console.error('PG insert error', err));

    res.send({ working: true });
});

// Start-up: connect Redis clients and then start Express
(async function start() {
    // connect redis with retry loop (does NOT call process.exit)
    await connectRedisWithRetry();

    // duplicate publisher and connect (v4 duplicate returns a client that must connect)
    try {
        redisPublisher = redisClient.duplicate();
        await redisPublisher.connect();
        console.log('Redis publisher connected');
    } catch (err) {
        console.error('Failed to connect redisPublisher', err);
        // continue — routes will log if publisher missing
    }

    // Start express server after attempting Redis clients
    app.listen(5000, err => {
        if (err) console.error('Express server error', err);
        console.log('Listening on port 5000');
    });
})();