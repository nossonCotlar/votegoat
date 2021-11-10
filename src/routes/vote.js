const { rHIncrBy } = require('../lib/redis');
const { pollExists, emitPollInfo } = require('../lib/helpers');

const post = async (req, res) => {
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
}

module.exports = { post };