require('dotenv').config();
const _ = require('lodash');
const { promisify } = require('util');

// Hashids stuff
const Hashids = require('hashids/cjs');
const HASHIDS_SALT = process.env.HASHIDS_SALT;
const hashids = new Hashids(HASHIDS_SALT, 15);
console.log(hashids.encode(1));

// Redis stuff
const redis = require('redis');
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


// Express stuff
const express = require('express');
const { result } = require('lodash');
const app = express();
const EXPRESS_PORT = process.env.EXPRESS_PORT;

// Express WS wrapper thingie
const expressWs = require('express-ws')(app);

app.use( express.json() );
app.use( express.urlencoded( {extended: true} ));

app.get('/poll/:pollId', async (req, res) => {
    res.json(await getPoll(req.params.pollId));
});

app.get('/test/:pollId', async (req, res) => {
    const pollId = req.params.pollId;
    console.log(pollId);
    result = await rGet(pollId);
    res.json(result);
});

app.post('/poll', async (req, res) => {
    const options = req.body.options || [];
    if(options.length < 1){
        res.status(400).json({error: "We need some options dawg"});
        return;
    }
    if(options.length > 20){
        res.status(400).json({error: "Whoah. Too many choices :/"});
        return;
    }
    console.log(`Creating a poll for options: ${options}`)
    const ipAddress = req.socket.remoteAddress;
    const timestamp = Date.now();
    const meta = {createdBy: ipAddress, createdAt: timestamp};
    const pollId = await createPoll(hashids, meta, options);
    console.log(`Created poll with Poll ID: ${pollId}`)
    res.json({pollId: pollId, url: `/poll/${pollId}`});
});

app.post('/vote/:pollId', async (req, res) => {
    pollId = req.params.pollId;
    const exists = await pollExists(pollId);
    if(!exists){
        res.status(404).json({error: `We couldn't find the poll with ID: ${pollId}`});
        return;
    }
    const option = req.body.option;
    console.log(option);
    const stance = await rHIncrBy(`poll:${pollId}:options`, option, 1);
    res.json({option: option, currentStance: stance});
});

app.listen(EXPRESS_PORT, _ => {
    console.log(`VoteGoat API listening on port: ${EXPRESS_PORT}`);
});

const createPoll = async (hashids, meta, options) => {
    let seed, hashid;
    let exists = true;
    while (exists){
        seed = Math.floor(Math.random() * 1000000);
        hashid = hashids.encode(seed);
        console.log(hashid);
        exists = await rExists(`poll:${hashid}:meta`);
    }
    let optionsArray = [];
    _.forEach(options, option => {
        optionsArray.push(option, 0);
    });

     // Set Poll Metadata
    const p1 = rSet(`poll:${hashid}:meta`, JSON.stringify(meta));

    // Set Poll Options
    const p2 = rHSet(`poll:${hashid}:options`, optionsArray);

    await Promise.all([p1, p2]);
    return hashid;
}

const getPoll = async (pollId) => {
    const pollOptions = await rHGetAll(`poll:${pollId}:options`);
    return pollOptions;
}

const getPollMeta = async (pollId) => {
    return await rGet(`poll:${pollId}:meta`);
}

const pollExists = async (pollId) => {
    return await rExists(`poll:${pollId}:meta`)
}