const { server: httpServer } = require('./server');
const { Server } = require('socket.io');
const io = new Server(httpServer);

console.log("Socket.io initiated")

module.exports = io;