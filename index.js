require('dotenv').config();

const { app, server, express } = require('./src/lib/server');

const routes = require('./src/routes');

app.get('/test/:pollId', routes.test.get);

app.get('/poll/:pollId', routes.poll.get);
app.post('/poll', routes.poll.post);

app.post('/vote/:pollId', routes.vote.post);

server.listen(process.env.EXPRESS_PORT, _ => {
    console.log(`VoteGoat API listening on port: ${process.env.EXPRESS_PORT}`);
});

process.on('SIGNINT', _ => {
    console.log("Shutting down server...");
    server.close();
    process.exit();
});