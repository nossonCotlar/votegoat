const { rGet } = require('../lib/redis')

const get = async (req, res) => {
    const pollId = req.params.pollId;
    console.log(pollId);
    result = await rGet(pollId);
    res.json(result);
}

module.exports = { get };