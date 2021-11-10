const Hashids = require('hashids/cjs');
const HASHIDS_SALT = process.env.HASHIDS_SALT;
const HASHIDS_LENGTH = parseInt(process.env.HASHIDS_LENGTH);
const hashids = new Hashids(HASHIDS_SALT, HASHIDS_LENGTH);

module.exports = hashids;