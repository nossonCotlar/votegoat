const { server: httpServer } = require('./server');
const { Server } = require('socket.io');
const io = new Server(httpServer);

module.exports = io;