const { getRandomHash } = require('./simpleHelpers');

const voterIdMiddleware = (req, res, next) => {
    const cookies = req.cookies;
    if(!Object.keys(cookies).includes('voterid')){
        res.cookie('voterid', getRandomHash());
    }
    next();
}

module.exports = voterIdMiddleware;