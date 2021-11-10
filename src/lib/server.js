const express = require('express');
const app = express();
const { createServer } = require('http');
const server = createServer(app);

module.exports = { app, server, express };