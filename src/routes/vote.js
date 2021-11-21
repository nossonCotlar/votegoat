const { rHIncrBy, rSAdd, rSIsMember } = require('../lib/redis');
const { pollExists, emitPollInfo, getRemoteAddress } = require('../lib/helpers');

const post = async (req, res) => {
    const pollId = req.params.pollId;
    if(await _handleVote(req, res)) return;
    const option = req.body.option;
    _recordVoterId(req);
    console.log(`Placing vote for option "${option}" in poll: ${pollId}`);
    const stance = await rHIncrBy(`poll:${pollId}:options`, option, 1);
    emitPollInfo(pollId); // when a vote is placed, emit updated poll results to everyone in the room
    res.json({option: option, currentStance: stance});
}

const _handleVote = async (req, res) => {
    pollId = req.params.pollId;
    const exists = await pollExists(pollId);
    if(!exists){
        res.status(404).json({error: `We couldn't find the poll with ID: ${pollId}`});
        return true;
    }
    const option = req.body.option;
    if(option == undefined || option == null){
        res.status(400).json({error: 'A vote option must be supplied'});
        return true;
    }
    if(! await _checkVoterId(req)){
        res.status(403).json({error: 'It has been detected that a vote has already been placed from this source. Multiple votes are no bueno.'});
        return true;
    }
    return false;
}

const _checkVoterId = async req => {
    if(Boolean(process.env.ALLOW_REVOTES)) return true;
    const pollId        = req.params.pollId;
    const remoteAddress = getRemoteAddress(req);
    const voterid       = req.cookies.voterid;
    const voterSet      = `poll:${pollId}:voters`;

    const pArray = [rSIsMember(voterSet, remoteAddress)];
    if(voterid != undefined) pArray.push(rSIsMember(voterSet, voterid));
    const results = await Promise.all(pArray);
    return ! results.includes(1);
}

const _recordVoterId = req => {
    const pollId        = req.params.pollId;
    const remoteAddress = getRemoteAddress(req);
    const voterid       = req.cookies.voterid;
    const voterSet      = `poll:${pollId}:voters`;

    const pArray = [rSAdd(voterSet, remoteAddress)];
    if(voterid != undefined) pArray.push(rSAdd(voterSet, voterid));
    Promise.all(pArray).catch(err => {
        console.log(`There was an error recording the voter id for ${pollId}: `, err);
    });
}

module.exports = { post };