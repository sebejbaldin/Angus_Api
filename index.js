const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const bodyParser = require('body-parser');
const cors = require('cors');
const dbmanager = require('./database/dbcon');
const authController = require('./auth/authController');
const structController = require('./factory/structure');
const verifyToken = require('./auth/verifyToken');
const queryes = require('./database/queryes');
const ip = require('ip');
const update_delay_millis = 10000; 

//represent the number of client connected with socket.io
var userConnected = 0;

app.use(cors());
app.use(bodyParser.json());
// Added authentication with jwt
app.use("/api/auth", authController);

// Added strucutre
app.use("/api/factory", structController);

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
app.post("/api/measure", (req, res) => {
    if (req.body != null) {
        dbmanager.insertMeasurement(res, req.body);
    } else {
        res.end("No data received.");
    }
});

app.get("/api/try", async (req, res) => {
    let obj = await dbmanager.getEnergyDrainBySens_Instant();
    console.log(obj);
    if (obj != undefined) res.status(200).send(obj);
    else res.status(500).send(obj);
});

app.get("/api/lastminute", async (req, res) => {
    res.status(200).send(await dbmanager.getEnergyLastMinuteBySens());
});

setInterval(async () => {
    await getManutentorHomeData();   
    io.emit('manutentor_data_home', manutentor_response);
}, update_delay_millis);

// socket.io body
io.on('connection', (socket) => {
    userConnected++;
    console.log('Users: ' + userConnected);

    /* socket.on('supervisor_home', async () => {
        console.log('nel socket.io di supervisor home');
        let sup_home = await getSupervisorHomeData();        
        console.log('Emitting data...');
        socket.emit('supervisor_data_home', sup_home);
    });

    socket.on('manutentor_home', async () => {
        console.log('nel socket.io di manutentor home');
        let man_home = await getManutentorHomeData();        
        console.log('Emitting data...');
        socket.emit('manutentor_data_home', man_home);
    }); */

    socket.on('home_run', async (grade) => {
        if (grade == 1) {
            //supervisor
            console.log('README: supervisor home');                        
            socket.emit('supervisor_data_home_energy', await getSupervisorEnergyData());
            socket.emit('supervisor_data_home_water', await getSupervisorWaterData());
            socket.emit('supervisor_data_home_uptime', await getSupervisorUptimeData());            
        }
        else if (grade == 2) {
            //manutentor
            console.log('README: manutentor home');                        
            await getManutentorHomeData();
            console.log('Emitting data...');
            socket.emit('manutentor_data_home', manutentor_response);                            
        }
    });

    socket.emit('instant_energy', [
        {
            time: 'now',
            value: Math.floor(Math.random() * (25000 - 200)) + 200,
            machine_id: 3,
            machine_name: 'engine 1'
        }, {
            time: 'now',
            value: Math.floor(Math.random() * (25000 - 200)) + 200,
            machine_id: 3,
            machine_name: 'engine 2'
        }, {
            time: 'now',
            value: Math.floor(Math.random() * (25000 - 200)) + 200,
            machine_id: 3,
            machine_name: 'washing'
        }, {
            time: 'now',
            value: Math.floor(Math.random() * (25000 - 200)) + 200,
            machine_id: 3,
            machine_name: 'dryer'
        }, {
            time: 'now',
            value: Math.floor(Math.random() * (25000 - 200)) + 200,
            machine_id: 3,
            machine_name: 'pre-washing'
        }
    ]);
    socket.on('disconnect', () => {
        userConnected--;
        console.log('A user disconnected\nRemaining users: ' + userConnected);
    });
});

// if the request haven't been captured yet, it return a 404 status to the request
app.get('*', (req, res) => {
    res
    .status(404)
    .end('Error 404, page not found.');
});

// server listening
const port = 8081;
server.listen(port, () => {
    console.log("Click me: http://" + ip.address() + ":" + port);
    console.log("Click me: http://localhost:" + port);
});

async function getSupervisorHomeData() {
    let sup_home = {};
    sup_home.energy_Average = await dbmanager.getEnergyDrain_Average(queryes.influx.timespan.week);
    sup_home.uptime_Average = await dbmanager.getUptime_Average(queryes.influx.timespan.week);
    sup_home.water_Average = await dbmanager.getWaterConsumption_Average(queryes.influx.timespan.week);
    sup_home.energy_Instant = await dbmanager.getEnergyDrain_Instant();
    sup_home.uptime_Instant = await dbmanager.getUptime_Instant();
    sup_home.water_Instant = await dbmanager.getWaterConsumption_Instant();
    //sup_home.water_Day_Grouped = await dbmanager.getWaterConsumption_Grouped_Day();
    //sup_home.energy_Day_Grouped = await dbmanager.getEnergyDrain_Grouped_Day();

    return sup_home;
}

async function getSupervisorEnergyData() {
    let tmp = {};
    tmp.energy_Average = await dbmanager.getEnergyDrain_Average(queryes.influx.timespan.week);
    tmp.energy_Instant = await dbmanager.getEnergyDrain_Instant();
    return tmp;
}

async function getSupervisorWaterData() {
    let tmp = {};
    tmp.water_Average = await dbmanager.getWaterConsumption_Average(queryes.influx.timespan.week);
    tmp.water_Instant = await dbmanager.getWaterConsumption_Instant();   
    return tmp;
}

async function getSupervisorUptimeData() {
    let tmp = {};
    tmp.uptime_Average = await dbmanager.getUptime_Average(queryes.influx.timespan.week);    
    tmp.uptime_Instant = await dbmanager.getUptime_Instant();    
    return tmp;
}
var manutentor_response = {
    update_time: null,
    pretreatment: {
        finisher: {
            max: 0,
            min:0
        },
        primer: {
            max: 0,
            min:0
        },
        pretreatment: {
            max: 0,
            min:0
        }
    },
    prewashing: {
        temp: 0,
        revolutionxminute: 0,
        water_level: {
            max: 0,
            min:0   
        }
    },
    washing: {
        temp: 0,
        revolutionxminute: 0,
        water_level: {
            max: 0,
            min:0
        }
    },
    drying: {
        temp: 0,
        revolutionxminute: 0
    },
    storage: {
        engine_one: {
            revolutionxminute : 0
        },
        engine_two: {
            revolutionxminute : 0
        }
    }
}

async function getManutentorHomeData() {
    if (manutentor_response.update_time && new Date().getTime() < (manutentor_response.update_time.getTime() + update_delay_millis )) 
        return;
    
    manutentor_response.update_time = new Date();
    let raw = {};
    raw.water = await dbmanager.getWaterLevel_Max_Grouped();
    raw.temp = await dbmanager.getTemperature_Grouped();
    raw.revol = await dbmanager.getRPM_Grouped();    
    //NEED TO REORDER THE ASSIGNATION OF WATER BASED ON THE ORDER OF THE RESPONSE
    manutentor_response.pretreatment.finisher.max = raw.water[0].max;
    manutentor_response.prewashing.water_level.max = raw.water[1].max;
    manutentor_response.washing.water_level.max = raw.water[2].max;
    manutentor_response.pretreatment.pretreatment.max = raw.water[3].max;
    manutentor_response.pretreatment.primer.max = raw.water[4].max;
    manutentor_response.prewashing.revolutionxminute = raw.revol[0].value;
    manutentor_response.washing.revolutionxminute = raw.revol[1].value;
    manutentor_response.drying.revolutionxminute = raw.revol[2].value;
    manutentor_response.storage.engine_one.revolutionxminute = raw.revol[3].value;
    manutentor_response.storage.engine_two.revolutionxminute = raw.revol[4].value;
    manutentor_response.prewashing.temp = raw.temp[0].value;
    manutentor_response.washing.temp = raw.temp[1].value;
    manutentor_response.drying.temp = raw.temp[2].value;    
}

class Manutentor_Home_Result {

}
