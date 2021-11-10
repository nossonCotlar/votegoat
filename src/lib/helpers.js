const _ = require('lodash');
const io = require('./socketio');
const hashids = require('./hashids');
const { rHGetAll, rSet, rHSet, rExists, rSAdd } = require('./redis');

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

const createPoll = async (meta, options) => {
    let hashid;
    let exists = true;
    while (exists){
        hashid = getRandomHash();
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

const getPoll = async pollId => {
    const pollOptionsRaw = await rHGetAll(`poll:${pollId}:options`);
    const pollOptions = parseObjNumbers(pollOptionsRaw);
    return pollOptions;
}

const getPollMeta = async pollId => {
    return await rGet(`poll:${pollId}:meta`);
}

const pollExists = async pollId => {
    return await rExists(`poll:${pollId}:meta`)
}

const emitPollInfoSingle = async (socket, pollId) => {
    const pollInfo = await getPoll(pollId);
    socket.emit("vote", pollInfo);
}

const emitPollInfo = async pollId => {
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

const getRemoteAddress = req => {
    return req.socket.remoteAddress;
}

const getRandomHash = _ => {
    return hashids.encode(Math.floor(Math.random() * 1000000));
}

module.exports = { createPoll, getPoll, getPollMeta, pollExists, emitPollInfo, emitPollInfoSingle, getRemoteAddress, getRandomHash }