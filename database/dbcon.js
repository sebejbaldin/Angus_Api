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

// this object contains all functions that interact with the database
module.exports = {
    getGlobalEnergySumLM: (io) => {
        // this function returns the global energy consumed in the last minute
        let conn = mysql.createConnection(configMSSQL);
        conn.connect();
        // with this query i get the list of machines that have the energy drain sensor
        conn.query(`select m.name, s.id, s.type from machines m 
        join sensors s on s.machine_id=m.id 
        where s.type='corrente assorbita'`, function (err, resultMy, fields) {
            if(err)
                console.log(err);
            
            // after i have received correctly the data of the machines i query the influxdb
            // for the measurement data
            influx
            .query(`select sum(value) 
            from (select * from testdata group by tag_sensor_id )
            where time > now() - 1m group by tag_sensor_id`)
            .then(result => {
                // received correctly the data this ones will be processed to return the data as expected
                let obj = { 
                    descr: 'globalSumLastMinute'
                };
                let sum = 0;
                try {
                    resultMy.forEach(element => {
                        let idSens = element.id;
                        result.forEach(item => {
                            if(item.tag_sensor_id == idSens) {
                                sum += item.sum;
                            }
                        })
                    });
                    obj.sum = sum;
                    console.log(obj);
                    // the data is now transmitted to all the client connected
                    io.emit('sumLastMin', obj);
                } catch(e) {
                    io.emit('sumLastMin', {err: 'NoData'});
                }
            })
            .catch(err => {
                console.log(err.stack);
            })
        });
        conn.end();
    },
    getEnergySumLastMinuteForSens: (io) => {
        let conn = mysql.createConnection(configMSSQL);

        conn.connect();
        conn.query(`select m.name, s.id, s.type from machines m 
        join sensors s on s.machine_id=m.id 
        where s.type='corrente assorbita'`, function (err, resultMy, fields) {
            if(err)
                console.log(err);
                //else
            //console.log(resultMy);
            influx
            .query(`select sum(value) 
            from (select * from testdata group by tag_sensor_id )
            where time > now() - 1m group by tag_sensor_id`)
            .then(result => {
                let obj = [];
                try {
                    resultMy.forEach(element => {
                        let idSens = element.id;
                        result.forEach(item => {
                            if(item.tag_sensor_id == idSens) {
                                obj.push({
                                    name: element.name,
                                    value: item.sum
                                });
                            }
                        })
                    });
                    console.log(obj);
                    io.emit('sumLastMin', obj);
                } catch(e) {
                    io.emit('sumLastMin', {err: 'NoData'});
                }
            })
            .catch(err => {
                console.log(err.stack);
            })
            
        });
        conn.end();
    },
    getInstantForMachine: (io) => {
        let conn = mysql.createConnection(configMSSQL);

        conn.connect();
        conn.query(`select m.name, s.id, s.type from machines m 
        join sensors s on s.machine_id=m.id 
        where s.type='corrente assorbita'`, function (err, resultMy, fields) {
            if(err)
                console.log(err);
            
            influx
            .query(`select * from testdata group by tag_sensor_id order by time desc limit 1`)
            .then(result => {
                let obj = [];
                resultMy.forEach(element => {
                    let idSens = element.id;
                    result.forEach(item => {
                        if(item.sensor_id === idSens) {
                            obj.push({
                                name: element.name,
                                value: item.value
                            });
                        }
                    })
                });
                console.log(obj);
                io.emit('insECons', obj);
            }).catch(err => {
                console.log(err.stack);
            })
        });
        conn.end();
    },
    tryQueryInflux: (res) => {
        let query = `select sum(value) 
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
        });
    },
    tryQueryMySQL: (res) => {
        let conn = mysql.createConnection(configMSSQL);
        const query = `select m.name, s.id, s.type from machines m 
        join sensors s on s.machine_id=m.id 
        where s.type='corrente assorbita'`;
        conn.connect();
        conn.query(query, function (err, resultMy, fields) {
            if(err)
                console.log(err);
            else 
                console.log(resultMy);

                let obj = {
                    query: query,
                    results: resultMy
                }

                res.json(obj);
        });
        conn.end();
    },
    tryQueryGen: (res) => {
        let conn = mysql.createConnection(configMSSQL);

        conn.connect();
        conn.query(`select m.name, s.id, s.type from machines m 
        join sensors s on s.machine_id=m.id 
        where s.type='corrente assorbita'`, function (err, resultMy, fields) {
            if(err)
                console.log(err);
                else
            console.log(resultMy);
            influx
            .query(`select sum(value) 
            from (select * from testdata group by tag_sensor_id )
            where time > now() - 1m group by tag_sensor_id`)
            .then(result => {
                let obj = [];
                try {
                    resultMy.forEach(element => {
                        let idSens = element.id;
                        result.forEach(item => {
                            if(item.tag_sensor_id == idSens) {
                                obj.push({
                                    name: element.name,
                                    value: item.sum
                                });
                            }
                        })
                    });
                    console.log(obj);
                    res.json(obj);
                } catch(e) {
                    res.json({err: 'NoData'});
                }
            })
            .catch(err => {
                console.log(err.stack);
            });            
        });
        conn.end();
    },
    insertMeasurement: (res, data) => {
        //insert testdata,tag_id=1,tag_sensor_id=13 id=1,sensor_id=13,value=100
        influx.writeMeasurement('testdata', [{
                tags: { tag_id: data.id, tag_sensor_id: data.sensor_id },
                fields: { id: data.id, sensor_id: data.sensor_id, value: data.value }
            }]);
        res.end('Inserted');
    }
}