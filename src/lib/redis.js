const redis = require('redis');
const { promisify } = require('util');
const REDIS_PORT = process.env.REDIS_PORT;

const redisClient = redis.createClient(REDIS_PORT);
redisClient.on('connect', _ => console.log('Redis Client Connected'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));

const rGet      = promisify(redisClient.get).bind(redisClient);
const rSet      = promisify(redisClient.set).bind(redisClient);
const rHGet     = promisify(redisClient.hget).bind(redisClient);
const rHGetAll  = promisify(redisClient.hgetall).bind(redisClient);
const rHSet     = promisify(redisClient.hset).bind(redisClient);
const rHIncrBy  = promisify(redisClient.hincrby).bind(redisClient);
const rExists   = promisify(redisClient.exists).bind(redisClient);
const rSAdd     = promisify(redisClient.sadd).bind(redisClient);

module.exports = {rGet, rSet, rHGet, rHGetAll, rHSet, rHIncrBy, rExists, rSAdd};