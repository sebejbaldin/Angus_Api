const Influx = require('influx');
const mysql = require('mysql');
const config = require('../config');
const queryes = require('./queryes');

var sensors_all = []; 

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
exports.ExampleDatabaseQuery = async () => {    
    let InfluxQuery = '**some query**';
    let MySQLQuery = '**another query**';
    // after have prepared the query you call the GetData function in which you pass three arguments
    // first mysql query, second an influx query, third a function to elaborate the data
    return await GetData(MySQLQuery, InfluxQuery, async (MySQLRes, InfluxRes) => {
        // what is about to happen is:
        // 1) use the function ReadQueryMySQL using the query passed
        // 2) same but using the ReadQueryInfluxDB function with the influx query
        // 3) pass to the function provided the results of both the query
        // 4) process the query using the third parameter of the function GetData,
        // so you provide the function to elaborate both the responses and return what you want
                
        // this is what will be do to the data in this case, for example:
        let exampleResponse = {
            mysql_response: MySQLRes,
            influx_response: InfluxRes
        }
        // after have the data processed you can for example return the response or anything other
        return exampleResponse;
    });
}

exports.getEnergyDrain_Average = async (timespan) => {
    return await GetData(undefined, queryes.influx.averageEnergy_Week, async (MyRes, InRes) => {
        console.log(InRes);        
        return InRes[0].mean;
    });
}

exports.getWaterConsumption_Average = async (timespan) => {
    return await GetData(undefined, queryes.influx.waterConsume_Week, async (MyRes, InRes) => {
        console.log(InRes);
        return InRes[0].mean;
    });
}

exports.getUptime_Average = async (timespan) => {
    return await GetData(undefined, queryes.influx.uptime_Week, async (MyRes, InRes) => {
        console.log(InRes);
        return InRes[0].mean;
    });
}

exports.getEnergyDrain_Instant = async () => {
    return await GetData(undefined, queryes.influx.energyConsumption_Instant, async (MyRes, InRes) => {
        console.log(InRes);
        return InRes[0].value;
    });
}

exports.getWaterConsumption_Instant = async () => {
    return await GetData(undefined, queryes.influx.waterConsumption_Instant, async (MyRes, InRes) => {
        console.log(InRes);
        return InRes[0].value;
    });
}

exports.getUptime_Instant = async () => {
    return await GetData(undefined, queryes.influx.uptime_Instant, async (MyRes, InRes) => {
        console.log(InRes);
        return InRes[0].value;
    });
}

exports.getEnergyDrain_Grouped_Day = async () => {
    return await GetData(undefined, queryes.influx.energyConsumption_Instant_Grouped, async (MyRes, InRes) => {
        console.log(InRes);
        let data = [];
        InRes.forEach(x => {
            let machine_name = '';
            sensors_all.forEach(y => {
                if (x.tag_sensor_id == y.sensor_id) {
                    machine_name = y.machine_name;                    
                }
            });
            data.push({
                value: x.value,
                //sensor_id: x.tag_sensor_id
                machine_name: machine_name
                });
            });
        return data;
    });        
};


exports.getWaterConsumption_Grouped_Day = async () => {
    return await GetData(undefined, queryes.influx.waterConsumption_Instant_Grouped, async (MyRes, InRes) => {
        console.log(InRes);
        let data = [];
        InRes.forEach(x => {
            let machine_name = '';
            sensors_all.forEach(y => {
                if (x.tag_sensor_id == y.sensor_id) {
                    machine_name = y.machine_name;                    
                }
            });
            data.push({
                value: x.value,
                //sensor_id: x.tag_sensor_id
                machine_name: machine_name
                });
            });
        return data;
    });
}
// these three are the query for the manutentor
exports.getWaterLevel_Max_Grouped = async () => {
    return await GetData(undefined, queryes.influx.waterTankLevel_FourHour_Max, async (MyRes, InRes) => {
        console.log(InRes);
        return InRes;
    });
}

exports.getTemperature_Grouped = async () => {
    return await GetData(undefined, queryes.influx.temperature_Instant_Grouped, async (MyRes, InRes) => {
        console.log(InRes);
        return InRes;        
    });
}

exports.getRPM_Grouped = async () => {
    return await GetData(undefined, queryes.influx.revolutionxMinute_Instant_Grouped, async (MyRes, InRes) => {
        console.log(InRes);
        return InRes;        
    });
}

exports.tryQueryInflux = async () => {
    return await GetData(undefined, queryes.influx.averageEnergy_Week, async (MyRes, InRes) => {
        return InRes;
    });
}

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
}

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
            if (err) {
                console.log(err);
                throw err;
            }
            // after have received response the connection is being closed        
            console.log('MySQL Result:\n' + resultMy);
            // the data are being inserted in the container
            // for some reasons i can't simply assign or return directly the result
            // if i try to do so out of the scope of the callback function the data vanish
            resultMy.forEach(x => {
                mysqlRes.push(x);
            });
            
            // if i only assign the result to the external variable, the data doesn't get out of the function
            // mysqlRes = resultMy;
        });
        return mysqlRes;
    } else
        return {};
}

// this function executes all the query on the influx database
async function ReadQueryInfluxDB(query) {
    if (queryIsValid(query)) {
        // on this function i haven't the same problem as mysql
        // so i can directly return the data 
        return await influx
            .query(query)
            .then((result) => {
                console.log('Influx result:\n' + result);
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
}

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
        console.log('Influx Response:\n' + dataIn);

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
        if (query == undefined)
        {
            console.log(query);
            return false;
        }
        if (string.length > 0)
            return true;

        return false;
    } catch (e) {
        console.log(e);
        return false;
    }
}

GetData(`select m.name as machine_name, s.machine_id as machine_id, s.id as sensor_id, s.type as sensor_type 
from machines m 
join sensors s 
on s.machine_id=m.id`, undefined, async (MyRes, InRes) => {
    try {
        MyRes.forEach(x => {
            sensors_all.push(x);
        });
    } catch(err) {   
        throw err;
    }
});