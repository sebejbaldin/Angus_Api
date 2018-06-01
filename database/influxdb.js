const Influx = require('influx');
const mysql = require('mysql');

const configMSSQL = {
    host: '192.168.101.63',
    port: 3306,
    user: 'piedpiper',
    password: 'PiedPiper2018',
    database: 'db_piedpiper'
};

const influx = new Influx.InfluxDB({
    host: '192.168.101.81',
    port: 8086,
    database: 'Angus_v1'
});

module.exports = {
    getGlobalEnergySumLM: (io) => {
        var conn = mysql.createConnection(configMSSQL);

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
                let obj = {descr: 'globalSumLastMinute'};
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
        var conn = mysql.createConnection(configMSSQL);

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
        var conn = mysql.createConnection(configMSSQL);

        conn.connect();
        conn.query(`select m.name, s.id, s.type from machines m 
        join sensors s on s.machine_id=m.id 
        where s.type='corrente assorbita'`, function (err, resultMy, fields) {
            if(err)
                console.log(err);
            else 
                console.log(resultMy);
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
                io.emit('insECons', obj);
            }).catch(err => {
                console.log(err.stack);
            })
        });
        conn.end();
    },
    tryQueryInflux: (res) => {
        const query = `select sum(value) 
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
            })
    },
    tryQueryMySQL: (res) => {
        var conn = mysql.createConnection(configMSSQL);
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
        var conn = mysql.createConnection(configMSSQL);

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
            })
            
        });
        conn.end();
    }
}