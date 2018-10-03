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
//in questo modo exporto un oggetto contenente tutte le funzioni che mi servono
//commento solo la prima funzione, visto che le altre sono praticamente uguali
//al massimo cambia il modo di aggregare i dati e le query
module.exports = {
    getGlobalEnergySumLM: (io) => {
        //funzione che ritorna il consumo globale dei componenti elettrici nell'ultimo minuto
        var conn = mysql.createConnection(configMSSQL);
        //faccio la connessione a mysql e recupero la lista di macchine che hanno i sensori di corrente elettrica
        conn.connect();
        conn.query(`select m.name, s.id, s.type from machines m 
        join sensors s on s.machine_id=m.id 
        where s.type='corrente assorbita'`, function (err, resultMy, fields) {
            if(err)
                console.log(err);
                //else
            //console.log(resultMy);
            //all'interno della funzione di callback
            //(che viene chiamata quando i dati della prima query sono pronti)
            //chiamo i dati anche da influx
            influx
            .query(`select sum(value) 
            from (select * from testdata group by tag_sensor_id )
            where time > now() - 1m group by tag_sensor_id`)
            .then(result => {
                //ricevuti i dati anche da influx li combino come richiesto e compongo l'oggetto da inviare
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
                    //emetto tramite socket.io il dato ai client connessi
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
        var conn = mysql.createConnection(configMSSQL);

        conn.connect();
        conn.query(`select m.name, s.id, s.type from machines m 
        join sensors s on s.machine_id=m.id 
        where s.type='corrente assorbita'`, function (err, resultMy, fields) {
            if(err)
                console.log(err);
            //else 
                //console.log(resultMy);
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
    },
    insertMeasurement: (res, data) => {
        //insert testdata,tag_id=1,tag_sensor_id=13 id=1,sensor_id=13,value=100
        influx.writeMeasurement('testdata', [
            {
                tags: { tag_id: data.id, tag_sensor_id: data.sensor_id },
                fields: { id: data.id, sensor_id: data.sensor_id, value: data.value }
            }
        ]);
        res.end('Inserted');
    },
    getAsyncQueryGen: async () => {
        let conn = mysql.createConnection(configMSSQL);

        conn.connect();
        let mysqlRes = await conn.query(`select m.name, s.id, s.type from machines m 
        join sensors s on s.machine_id=m.id 
        where s.type='corrente assorbita'`, function (err, resultMy, fields) {
            conn.end();
            
            if(err) {
                console.log(err);
                throw err;                
            }
            
            return resultMy;            
        });
        let influxRes = await influx
        .query(`select sum(value) 
        from (select * from testdata group by tag_sensor_id )
        where time > now() - 1m group by tag_sensor_id`)
        .then((result) => {
            return result;
        })
        .catch(err => {
            console.log(err.stack);
            throw err;
        });

        let obj = [];
        try {
            mysqlRes.forEach(element => {
                let idSens = element.id;
                influxRes.forEach(item => {
                    if(item.tag_sensor_id == idSens) {
                        obj.push({
                            name: element.name,
                            value: item.sum
                        });
                    }
                })
            });
            console.log(obj);
            return obj;
        } catch(e) {
            return {err: 'NoData'};
        }            
    }
}