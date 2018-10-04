const Influx = require('influx');
const mysql = require('mysql');
// database configuration
const configMSSQL = {
    host: 'localhost',
    port: 3306,
    user: 'piedpiper',
    password: 'piedpiper',
    database: 'db_piedpiper'
};

const influx = new Influx.InfluxDB({
    host: '192.168.101.81',
    port: 8086,
    database: 'Angus_v1'
});

var conn = mysql.createConnection(configMSSQL);

exports.getGlobalEnergySumLM = async () => {
    let MyQuery = `select m.name, s.id, s.type from machines m 
    join sensors s on s.machine_id=m.id 
    where s.type='corrente assorbita'`;
    let InQuery = `select sum(value) 
    from (select * from testdata group by tag_sensor_id )
    where time > now() - 1m group by tag_sensor_id`;

    return await GetData(MyQuery, InQuery, async (MyRes, InRes) => {
        // the data are being processed after have being received from the database 
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
    let InQuery = `select sum(value) 
    from (select * from testdata group by tag_sensor_id )
    where time > now() - 1m group by tag_sensor_id`;

    return GetData(MyQuery, InQuery, async (MyRes, InRes) => {

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

/*
query consumo istantaneo per ogni sensor id:
  select * from testdata group by tag_sensor_id order by time desc limit 1
*/
exports.getInstantEnergyDrainForSensor = async () => {
    let MyQuery = `select * from sensors`;
    let InQuery = `select * from testdata group by tag_sensor_id order by time desc limit 1`;

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
    let InQuery = `select * from testdata 
    group by tag_sensor_id 
    order by time desc 
    limit 1`;

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

exports.tryQueryInflux = async (res) => {
    
    let InfluxResult = await GetData(MyQuery, `select * from testdata limit 1`, async (MyRes, InRes) => {
        return InRes;
    });
    res.send(InfluxResult);
};

exports.insertMeasurement = (res, data) => {
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
    res.end('Inserted');
};

// this function executes all the query on the mysql database
async function ReadQueryMySQL(query) {
    if (queryIsValid(query)) {
        // inizialized the container of the result
        let mysqlRes = [];
        // connect to the database
        conn.connect();
        // the query is beign processed        
        await conn.query(query, (err, resultMy, fields) => {
            conn.end();
            // after have received response the connection is being closed        
            console.log(resultMy);
            // the data are being inserted
            resultMy.forEach(x => {
                mysqlRes.push(x);
            });
            if (err) {
                console.log(err);
                throw err;
            }
            // if i only assign the result to the external variable, the data doesn't get out of the function
            //mysqlRes = resultMy;
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

async function GetData(qMySQL, qInflux, processor) {
    let dataMy = {};
    let dataIn = {};
    try {

        dataMy = await ReadQueryMySQL(qMySQL);

    } catch (errz) {
        console.log(errz);
        return {
            err: 'Error on mysql query'
        };
    }
    try {

        dataIn = await ReadQueryInfluxDB(qInflux);

    } catch (errz) {
        console.log(errz);
        return {
            err: 'Error on influx query'
        };
    }
    try {

        return await processor(dataMy, dataIn);

    } catch (errz) {
        console.log(errz);
        return {
            err: 'Error on processing data'
        };
    }
}

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