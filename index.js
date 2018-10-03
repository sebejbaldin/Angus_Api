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
app.use((req, res, next) => {
    verifyToken(req, res, next);
});

//const Class = require('./classes');

//pagina di prova per visualizzare i json, con firefox è meglio
app.post('/try', (req, res) => {
    //dbmanager.tryQueryGen(res);
    dbmanager.insertMeasurement(res, {});
});

//api con post per l'inserimento di nuovi dati da parte dei sensori
app.post('/api/measure', (req, res) => {
    if (req.body != null) {
        dbmanager.insertMeasurement(res, req.body);
    } else {
        res.end('No data received.');
    }
});

app.get('/api/lastminute', (req, res) => {
    dbmanager.tryQueryGen(res);
});

setInterval(() => {
    //dbmanager.getEnergySumLastMinuteForSens(io);
}, 15000);

//gestione degli utenti che si connettono a socket.io
io.on('connection', (socket) => {
    userConnected++;
    console.log('Users: ' + userConnected);
    //quando un nuovo utente si connette gli invia subito i dati che servono al client, 
    //che sono ancora da definire bene
    dbmanager.getEnergySumLastMinuteForSens(socket);
    socket.on('disconnect', () => {
        userConnected--;
        console.log('A user disconnected\nRemaining users: ' + userConnected);
    });
});

//se la pagina richiesta non viene catturata da uno dei precedenti get la cattura questo che notifica il 404
app.get('/*', (req, res) => {
    res
    .status(404)
    .end('Error 404, page not found.');
});

//metto il server in ascolto
const port = 8081;
server.listen(port, () => {
    console.log("Click me: http://localhost:" + port);
});

