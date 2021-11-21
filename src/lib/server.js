const express = require('express');
const { createServer } = require('http');
const app = express();
const server = createServer(app);

const cookieParser = require('cookie-parser');
const voterid = require('./voterIdMiddleware');

app.use( express.json() );
app.use( express.urlencoded( {extended: true} ));
app.use( cookieParser() );
app.use( voterid );
app.use( '/', express.static('static') );

console.log("Server Initiated")

module.exports = { app, server, express };