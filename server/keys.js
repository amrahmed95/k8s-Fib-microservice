module.exports =  {
  pgUser: process.env.POSTGRES_USER || 'postgres',
  pgHost: process.env.POSTGRES_HOST || 'postgres',
  pgDatabase: process.env.POSTGRES_DB || 'postgres',
  pgPassword: process.env.POSTGRES_PASSWORD || 'password',
  pgPort: process.env.POSTGRES_PORT || 5432,
  redisHost: process.env.REDIS_HOST || 'redis',
  redisPort: process.env.REDIS_PORT || 6379
};