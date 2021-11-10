const { getRandomHash } = require('./helpers');

const voterIdMiddleware = (req, res, next) => {
    const cookies = req.cookies;
    if(Object.keys(cookies).includes('voterid')){
        res.cookie('voterid', getRandomHash());
    }
    console.log(cookies);
    next();
}

module.exports = voterIdMiddleware;