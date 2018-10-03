const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const bodyParser = require('body-parser');
const cors = require('cors');
const dbmanager = require('./database/dbcon');
const authController = require('./auth/authController');
const verifyToken = require('./auth/verifyToken');

//represent the number of client connected with socket.io
var userConnected = 0;

app.use(cors());
app.use(bodyParser.json());
// Added authentication with jwt
app.use('/api/auth', authController);

// middleware that check if the user is authenticated
// if the user isn't authenticated it block the request, otherwise let the request to be processed
app.use((req, res, next) => {
    verifyToken(req, res, next);
});

/* app.post('/try', (req, res) => {
    //dbmanager.tryQueryGen(res);
    dbmanager.insertMeasurement(res, {});
}); */

// post api to insert new measurements
app.post('/api/measure', (req, res) => {
    if (req.body != null) {
        dbmanager.insertMeasurement(res, req.body);
    } else {
        res.end('No data received.');
    }
});

app.get('/api/lastminute', async (req, res) => {
    let obj = dbmanager.getAsyncQueryGen();
    console.log(obj);
    if (obj != undefined)
        res.status(200).send(obj);
    else
        res.status(500).send(obj);
});

/* setInterval(() => {
    //dbmanager.getEnergySumLastMinuteForSens(io);
}, 15000); */

// socket.io body
io.on('connection', (socket) => {
    userConnected++;
    console.log('Users: ' + userConnected);
    
    dbmanager.getEnergySumLastMinuteForSens(socket);
    socket.on('disconnect', () => {
        userConnected--;
        console.log('A user disconnected\nRemaining users: ' + userConnected);
    });
});

// if the request haven't been captured yet, it return a 404 status to the request
app.get('/*', (req, res) => {
    res
    .status(404)
    .end('Error 404, page not found.');
});

// server listening
const port = 8081;
server.listen(port, () => {
    console.log("Click me: http://localhost:" + port);
});

