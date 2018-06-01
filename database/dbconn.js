const http = require('http');
const querystring = require('querystring');
const queryes = {
  db: 'Angus_v1',
  query: [
    'select sum(value) from (select * from testdata group by tag_sensor_id  limit 60) group by tag_sensor_id',
    'select sum(value) from (select * from testdata group by sensor_id order by time desc limit 60) group by sensor_id order by time desc',
    'select sum(value) from (select * from testdata group by tag_sensor_id )where time > now() - 1m group by tag_sensor_id'
  ]
}

const config = {
    hostname: '192.168.101.81',
    port: 8086,
}

module.exports.getListGET = () => {
    var queryselect="http://192.168.101.115:8086/query?db=test1&q=select+*+from+mymeas+limit+12";

    http.get(queryselect, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                            `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                            `Expected application/json but received ${contentType}`);
        }
        if (error) {
            console.error(error.message);
            // consume response data to free up memory
            res.resume();
            return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                return parsedData;
                console.log(parsedData.results[0].series[0].values);
            } catch (e) {
                console.error(e.message);
                return;
            }
        });
    }).on('error', (e) => {
        return;
        console.error(`Got error: ${e.message}`);
    });
};

module.exports.queryDatabase = (socket, queryID) => {
      //http://192.168.101.115:8086/query?db=test1&q=select+*+from+mymeas+limit+150
      const postData = querystring.stringify({
        'db': queryes.db,
        'q': queryes.query[queryID]
      });
      /*
        query per il consumo al minuto somma totale
        select sum(value) from (select * from testdata group by sensor_id order by time desc limit 60) group by sensor_id order by time desc
        query per il consumo al minuto di ogni sensore
        select sum(value) from (select * from testdata group by tag_sensor_id  limit 60) group by tag_sensor_id
      */
      const options = {
        hostname: config.hostname,
        port: config.port,
        path: '/query',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          let parChunck = JSON.parse(chunk);
          let obj = {

          }
          console.log(`BODY: ${chunk}`);
          socket.emit('data', parChunck);
        });
        res.on('end', () => {
          console.log('No more data in response.');
        });
      });
      req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
      });
      
      // write data to request body
      req.write(postData);
      req.end();
};

module.exports.insertToDBwithPOST = (io, res, measure) => {
    //localhost:8086/write?db=test1
      
      const postData = 'prova_seb,Title=ciao_dal_server value=30';
      // &q=prova_seb,Title=ciao_dal_server+value=30
      const options = {
        hostname: config.hostname,
        port: config.port,
        path: '/write?db=test1',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          console.log(`BODY: ${chunk}`);
          io.emit('update', JSON.parse(chunk));
        });
        res.on('end', () => {
          console.log('No more data in response.');
        });
      });
      console.log("Ciao stupida asincronia insert.");
      req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
      });
      
      // write data to request body
      req.write(postData);
      req.end();
};

