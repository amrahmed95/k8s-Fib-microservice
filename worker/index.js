const keys = require('./keys');
const redis = require('redis');

// connection to redis server
const redisClient = redis.createClient({
  // Use v4 socket options and service host from compose/k8s
  socket: {
    host: keys.redisHost,
    port: keys.redisPort
  }
});

// helper to connect with retry loop (don't crash if Redis is slow to start)
async function connectRedisWithRetry() {
  const retryDelayMs = 3000;
  while (true) {
    try {
      await redisClient.connect();
      console.log('Worker: Connected to Redis');
      break;
    } catch (err) {
      console.error('Worker: Failed to connect to Redis', err);
      console.log(`Worker: Retrying Redis connection in ${retryDelayMs / 1000}s`);
      await new Promise(res => setTimeout(res, retryDelayMs));
    }
  }
}

function fib(index) {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

(async () => {
  await connectRedisWithRetry();

  // create and connect subscriber
  const sub = redisClient.duplicate();
  try {
    await sub.connect();
    console.log('Worker: Subscriber connected');
  } catch (err) {
    console.error('Worker: Subscriber failed to connect', err);
  }

  // subscribe with v4 API
  await sub.subscribe('insert', async (message) => {
    console.log('Received message:', message);
    const idx = parseInt(message, 10);
    const result = fib(idx);
    console.log('Computed Fibonacci:', result);
    try {
      // v4 uses hSet (async)
      await redisClient.hSet('values', message, result.toString());
    } catch (err) {
      console.error('Failed to write to Redis hash', err);
    }
  });
})();