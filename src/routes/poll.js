const { getPoll, createPoll } = require('../lib/helpers');

const get = async (req, res) => {
    res.json(await getPoll(req.params.pollId));
}

const post = async (req, res) => {
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
    const pollId = await createPoll(meta, options);
    console.log(`Created poll with Poll ID: ${pollId}`)
    res.json({pollId: pollId, url: `/p?id=${pollId}`});
}

module.exports = { get, post }