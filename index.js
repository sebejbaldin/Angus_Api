const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

var userConnected = 0;

const app = express();

const dbinflux = require('./database/influxdb');

const Class = require('./classes');

const server = require('http').Server(app);
const io = require('socket.io')(server);

var authController = require('./auth/authController');

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authController);

app.use('/try', (req, res) => {
    dbinflux.tryQueryGen(res);
})

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/page/index.html');
});

app.get('/main.js', (req, res) => {
    res.sendFile(__dirname + '/page/main.js');
});

app.get('/jquery.js', (req, res) => {
    res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js');
});

app.get('/bootstrap.min.css', (req, res) => {
    res.sendFile(__dirname + '/node_modules/bootstrap/dist/css/bootstrap.min.css');
});

/*  
    Ogni componente elettrico (motore, pompa,
    ventilatore) ha alcuni sensori che raccolgono
    ogni secondo i dati di:

    corrente assorbita
    numero di giri
    ore lavoro 
*/

app.post('/api/insert', (req, res) => {
    if (req.body != null) {
        let measure = req.body;
        //dbinflux.insertToDBwithPOST(io, res, measure);
    } else {
        res.end('No data received.');
    }
});

/* setInterval(() => {
    dbinflux.queryDatabase(io);
}, 5000);  */

io.on('connection', (socket) => {
    userConnected++;
    console.log('Users: ' + userConnected);
    dbinflux.getEnergySumLastMinuteForSens(socket);
    socket.on('disconnect', () => {
        userConnected--;
        console.log('A user disconnected\nRemaining users: ' + userConnected);
    });
});

app.get('/*', (req, res) => {
    res
    .status(404)
    .end('Errore 404, pagina non trovata.')
})

const port = 8081;
server.listen(port, () => {
    console.log("Click me: http://localhost:" + port);
});

