const hashids = require('../lib/hashids');
const { getPoll, createPoll, getRemoteAddress, getRandomHash } = require('../lib/helpers');

const get = async (req, res) => {
    console.log('Cookies: ', req.cookies);
    res.cookie('testcookie', 'this is a test').json(await getPoll(req.params.pollId));
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
    console.log(`Creating a poll for options: ${options}`);
    const createdBy = getRemoteAddress(req);
    const createdAt = Date.now();
    const ownerSecret = getRandomHash();
    const meta = {createdBy, createdAt, ownerSecret};
    const pollId = await createPoll(meta, options);
    console.log(`Created poll with Poll ID: ${pollId}`)
    res.json({pollId: pollId, url: `/p?id=${pollId}`});
}

module.exports = { get, post };