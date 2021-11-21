const hashids = require('./hashids');

const getRandomHash = _ => {
    return hashids.encode(Math.floor(Math.random() * 1000000));
}

module.exports = { getRandomHash }