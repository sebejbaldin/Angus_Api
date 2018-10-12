const Influx = require('influx');
const mysql = require('mysql');
const config = require('../config');
const queryes = require('./queryes');

// database configuration
const configMSSQL = {
    host: config.mysql_config.hostname,
    port: config.mysql_config.port,
    user: config.mysql_config.username,
    password: config.mysql_config.password,
    database: config.mysql_config.database
};

const influx = new Influx.InfluxDB({
    host: config.influx_config.hostname,
    port: config.influx_config.port,
    database: config.influx_config.database
});

// i'll comment only the first function of this type because the concept is the same for all
// for the description of the functions called inside this, scroll down
exports.getGlobalEnergySumLM = async () => {
    let MyQuery = `select m.name, s.id, s.type from machines m 
    join sensors s on s.machine_id=m.id 
    where s.type='corrente assorbita'`;
    /* let InQuery = `select sum(value) 
    from (select * from testdata group by tag_sensor_id )
    where time > now() - 1m group by tag_sensor_id`; */
    let InQuery = queryes.influx.energyDrain_Minute_Global;

    // after have prepared the query you call the GetData function in which you pass three arguments
    // first mysql query, second a influx query, third a function to elaborate the data
    return await GetData(MyQuery, InQuery, async (MyRes, InRes) => {
        // what is about to happen is:
        // 1) use the function ReadQueryMySQL using the query passed
        // 2) same but using the influx function ad influx query
        // 3) pass to the function providedthe results of the queryes and return the data 
                
        // this is what will be do to the data in this case
        let obj = {
            descr: 'globalEnergySumLastMinute'
        };
        let sum = 0;

        MyRes.forEach(element => {
            let idSens = element.id;
            InRes.forEach(item => {
                if (item.tag_sensor_id == idSens) {
                    sum += item.sum;
                }
            });
        });
        obj.sum = sum;
        return obj;
    });
};

exports.getEnergyLastMinuteBySens = async () => {
    let MyQuery = `select m.name, s.id, s.type from machines m 
    join sensors s on s.machine_id=m.id 
    where s.type='corrente assorbita'`;
    //let InQuery = queryes.influx.energyDrainBySensor_Minute_Global;
    let InQuery = `select sum(value) 
    from (select * from testdata group by tag_sensor_id )
    where time > now() - 1m group by tag_sensor_id`;

    return await GetData(MyQuery, InQuery, async (MyRes, InRes) => {

        let obj = [];
        MyRes.forEach(element => {
            let idSens = element.id;
            InRes.forEach(item => {
                if (item.tag_sensor_id == idSens) {
                    obj.push({
                        name: element.name,
                        value: item.sum
                    });
                }
            })
        });
        console.log(obj);
        return obj;

    });
};

exports.getInstantEnergyDrainForSensor = async () => {
    let MyQuery = `select * from sensors`;
    let InQuery = `select * from testdata group by tag_sensor_id order by time desc limit 1`;
    //let InQuery = queryes.influx.

    return await GetData(MyQuery, InQuery, async (MyRes, InRes) => {

        let obj = [];
        InRes.forEach(m => {
            MyRes.forEach(k => {
                if (m.sensor_id == k.id) {
                    obj.push({
                        time: m.time,
                        id: m.id,
                        sensor_id: m.sensor_id,
                        value: m.value,
                        sensor_type: k.type,
                        machine_id: k.machine_id
                    });
                }
            });
        });
        return obj;

    });
}

exports.getInstantByMachine = async () => {
    let MyQuery = `select m.name, s.id, s.type from machines m 
    join sensors s on s.machine_id=m.id 
    where s.type='corrente assorbita'`;
    let InQuery = queryes.influx.energyDrain_Instant;

    return await GetData(MyQuery, InQuery, async (MyRes, InRes) => {

        let obj = [];
        MyRes.forEach(element => {
            let idSens = element.id;
            InRes.forEach(item => {
                if (item.sensor_id === idSens) {
                    obj.push({
                        name: element.name,
                        value: item.value
                    });
                }
            })
        });
        console.log(obj);
        return obj;
    });
};

exports.tryQueryInflux = async () => {
    
    return await GetData("", queryes.influx.energyDrainBySensor_Minute_Global, async (MyRes, InRes) => {
        return InRes;
    });
    //res.send(InfluxResult);
};

exports.insertMeasurement = (data) => {
    //insert testdata,tag_id=1,tag_sensor_id=13 id=1,sensor_id=13,value=100
    influx.writeMeasurement('testdata', [{
        tags: {
            tag_id: data.id,
            tag_sensor_id: data.sensor_id
        },
        fields: {
            id: data.id,
            sensor_id: data.sensor_id,
            value: data.value
        }
    }]);
    return true;
};

// this function executes all the query on the mysql database
async function ReadQueryMySQL(query) {
    let conn = mysql.createConnection(configMSSQL);
    if (queryIsValid(query)) {
        // inizialize the container of the result
        let mysqlRes = [];
        // connect to the database
        conn.connect();
        // the query is beign processed        
        await conn.query(query, (err, resultMy, fields) => {
            conn.end();
            // after have received response the connection is being closed        
            console.log(resultMy);
            // the data are being inserted in the container
            // for some reasons i can't simply assign or return directly the result
            // if i try to do so out of the scope of the callback function the data vanish
            resultMy.forEach(x => {
                mysqlRes.push(x);
            });
            if (err) {
                console.log(err);
                throw err;
            }
            // if i only assign the result to the external variable, the data doesn't get out of the function
            // mysqlRes = resultMy;
        });
        return mysqlRes;
    } else
        return {};
};

// this function executes all the query on the influx database
async function ReadQueryInfluxDB(query) {
    if (queryIsValid(query)) {
        // on this function i haven't the same problem as mysql
        // so i can directly return the data 
        return await influx
            .query(query)
            .then((result) => {
                // if the query is success return the data
                return result;
            })
            .catch(err => {
                // otherwise throw error
                console.log(err.stack);
                throw err;
            });
    } else
        return {};
};

// this function is the one to use to get data from the database
// it's parameters are (in the same order): the query for mysql db and the one for influx db, the function to process the data to return
// i have split the try/catch in three because as is i can send personalized error to source
// i don't like much this approach but since you actually can't catch specific exception with
// differenct catch branches i don't know how to do it better
async function GetData(qMySQL, qInflux, processor) {
    let dataMy = {};
    let dataIn = {};
    try {
        //the first query is executed on the mysql db
        dataMy = await ReadQueryMySQL(qMySQL);
        console.log(dataMy);
    } catch (errz) {
        console.log(errz);
        return {
            err: 'Error on mysql query'
        };
    }
    try {
        // second query is executed on the influx db 
        dataIn = await ReadQueryInfluxDB(qInflux);
        console.log(dataIn);

    } catch (errz) {
        console.log(errz);
        return {
            err: 'Error on influx query'
        };
    }
    try {
        // the data is passed to the function provided, processed and returned
        return await processor(dataMy, dataIn);

    } catch (errz) {
        console.log(errz);
        return {
            err: 'Error on processing data',
            mysql_data: dataMy,
            influx_data: dataIn
        };
    }
}

// this function do some check to the query, it should be extended later
function queryIsValid(query) {
    try {
        let string = "";
        string = query;
        if (string.length > 0)
            return true;

        /*  let x = 0;
         while (query[x] != undefined && query[x] != null) {
             x++;
         }
         if (x > 0)
             return true; */


        return false;
    } catch (e) {
        console.log(e);
        return false;
    }
}