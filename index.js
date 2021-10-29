require('dotenv').config();
const _ = require('lodash');
const { promisify } = require('util');

// Hashids stuff
const Hashids = require('hashids/cjs');
const HASHIDS_SALT = process.env.HASHIDS_SALT;
const HASHIDS_LENGTH = parseInt(process.env.HASHIDS_LENGTH);
const hashids = new Hashids(HASHIDS_SALT, HASHIDS_LENGTH);

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
const rSAdd     = promisify(redisClient.sadd).bind(redisClient);


// Express/http stuff
const express = require('express');
const { result } = require('lodash');
const app = express();
const { createServer } = require('http');
const httpServer = createServer(app);
const EXPRESS_PORT = process.env.EXPRESS_PORT;

const WS_PORT = parseInt(process.env.WS_PORT);
const { Server } = require('socket.io');
const io = new Server(httpServer);

io.on('connection', async socket => {
    const socketId = socket.id;
    const remoteAddress = socket.handshake.address;
    const pollId = socket.handshake.query.id;
    console.log(`Socket ${socketId} connected from ${remoteAddress} on poll ${pollId}`);
    socket.join(`poll:${pollId}:room`);
    Promise.all([
        rSAdd(`poll:${pollId}:subs`, socketId), 
        emitPollInfoSingle(socket, pollId)
    ]);
});

// Express WS wrapper thingie
//const expressWs = require('express-ws')(app);

app.use( express.json() );
app.use( express.urlencoded( {extended: true} ));
app.use( '/', express.static('static') );

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
    res.json({pollId: pollId, url: `/p?id=${pollId}`});
});

app.post('/vote/:pollId', async (req, res) => {
    pollId = req.params.pollId;
    const exists = await pollExists(pollId);
    if(!exists){
        res.status(404).json({error: `We couldn't find the poll with ID: ${pollId}`});
        return;
    }
    const option = req.body.option;
    console.log(`Placing vote for option "${option}" in poll: ${pollId}`);
    const stance = await rHIncrBy(`poll:${pollId}:options`, option, 1);
    emitPollInfo(pollId); // when a vote is placed, emit updated poll results to everyone in the room
    res.json({option: option, currentStance: stance});
});

httpServer.listen(EXPRESS_PORT, _ => {
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
    const pollOptionsRaw = await rHGetAll(`poll:${pollId}:options`);
    const pollOptions = parseObjNumbers(pollOptionsRaw);
    return pollOptions;
}

const getPollMeta = async (pollId) => {
    return await rGet(`poll:${pollId}:meta`);
}

const pollExists = async (pollId) => {
    return await rExists(`poll:${pollId}:meta`)
}

const emitPollInfoSingle = async (socket, pollId) => {
    const pollInfo = await getPoll(pollId);
    socket.emit("vote", pollInfo);
}

const emitPollInfo = async (pollId) => {
    const pollInfo = await getPoll(pollId);
    io.sockets.in(`poll:${pollId}:room`).emit('vote', pollInfo);
}

const parseObjNumbers = obj => {
    let result = {};
    const entries = Object.entries(obj);
    for(const i in entries){
        const k = entries[i][0], v = entries[i][1];
        result[k] = parseInt(v) === NaN ? v : parseInt(v);
    }
    return result;
}