const Influx = require('influx');
const mysql = require('mysql');
//file di configurazione
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
//in questo modo exporto un oggetto contenente tutte le funzioni che mi servono
//commento solo la prima funzione, visto che le altre sono praticamente uguali
//al massimo cambia il modo di aggregare i dati e le query

exports.getGlobalEnergySumLM = async () => {
    let MySQLResult = await ReadQueryMySQL(`select m.name, s.id, s.type from machines m 
    join sensors s on s.machine_id=m.id 
    where s.type='corrente assorbita'`);

    let InfluxResult = await ReadQueryInfluxDB(`select sum(value) 
    from (select * from testdata group by tag_sensor_id )
    where time > now() - 1m group by tag_sensor_id`);

    let obj = {
        descr: 'globalSumLastMinute'
    };
    let sum = 0;
    try {
        MySQLResult.forEach(element => {
            let idSens = element.id;
            InfluxResult.forEach(item => {
                if (item.tag_sensor_id == idSens) {
                    sum += item.sum;
                }
            })
        });
        obj.sum = sum;
        return obj;
    } catch (e) {
        return {
            err: 'NoData'
        };
    }
};

exports.getEnergyLastMinuteBySens = async () => {

    let MySQLResult = await ReadQueryMySQL(`select m.name, s.id, s.type from machines m 
    join sensors s on s.machine_id=m.id 
    where s.type='corrente assorbita'`);

    let InfluxResult = await ReadQueryInfluxDB(`select sum(value) 
    from (select * from testdata group by tag_sensor_id )
    where time > now() - 1m group by tag_sensor_id`);

    
    let obj = [];
    try {
        MySQLResult.forEach(element => {
            let idSens = element.id;
            InfluxResult.forEach(item => {
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
    } catch (e) {
        return {
            err: 'NoData'
        };
    }
};

exports.getInstantByMachine = async () => {
    let MySQLResult = await ReadQueryMySQL(`select m.name, s.id, s.type from machines m 
    join sensors s on s.machine_id=m.id 
    where s.type='corrente assorbita'`);

    let InfluxResult = await ReadQueryInfluxDB(`select * from testdata 
    group by tag_sensor_id 
    order by time desc 
    limit 1`);

    let obj = [];
    try {
        MySQLResult.forEach(element => {
            let idSens = element.id;
            InfluxResult.forEach(item => {
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
    } catch (e) {
        return {
            err: 'NoData'
        };
    }
};

exports.tryQueryInflux = async (res) => {
    /* const query = `select sum(value) 
        from (select * from testdata group by tag_sensor_id )
        where time > now() - 1m group by tag_sensor_id`;
        
    influx
        .query(query)
        .then(result => {
            let obj = {
                query: query,
                results: result
            }
            res.json(obj);
        }).catch(err => {
            console.log(err.stack);
        }) */
        let InfluxResult = await ReadQueryInfluxDB(`select * from testdata limit 1`);
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

async function ReadQueryMySQL(query) {
    let mysqlRes = [];
    //let conn = mysql.createConnection(configMSSQL);
    conn.connect();
    await conn.query(query, (err, resultMy, fields) => {
        conn.end();
        
        console.log(resultMy);
        resultMy.forEach(x => {
            mysqlRes.push(x);
        });
        if (err) {
            console.log(err);
            throw err;
        }
        //mysqlRes = resultMy;
    });
    return mysqlRes;
};

async function ReadQueryInfluxDB(query) {
    return await influx
        .query(query)
        .then((result) => {
            return result;
        })
        .catch(err => {
            console.log(err.stack);
            throw err;
        });
};