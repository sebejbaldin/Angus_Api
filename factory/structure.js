const express = require("express");
const mysql = require("mysql");
const verifyToken = require("../auth/verifyToken");
const jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
const config = require("../config"); // get config file


var router = express.Router();

const mysqlConf = {
  host: config.hostname,
  user: config.username,
  password: config.password,
  database: config.db_name
};

router.post("/struct", verifyToken, function(req, res, next) {
    let conn = mysql.createConnection(mysqlConf);
    conn.connect(function(err) {
        if(err) {
            console.log("error connecting: " + err.stack);
            return;
        }
        console.log(
            '[STRUCT:request]\t(' +
              new Date().toLocaleString() +
              ')\ttrying to get data for user ' +
              req.userEmail +
              ' from\t' +
              req.connection.remoteAddress +
              ' [' +
              conn.threadId +
              ']'
          );
    });
    console.log(`
    SELECT * FROM establishments 
    JOIN production_lines   ON establishments.id=production_lines.establishment_id 
    JOIN machines           ON machines.production_line_id=production_lines.id 
    JOIN sensors            ON sensors.machine_id=machines.id`)
    conn.query(`
    SELECT * FROM establishments 
    JOIN production_lines   ON establishments.id=production_lines.establishment_id 
    JOIN machines           ON machines.production_line_id=production_lines.id 
    JOIN sensors            ON sensors.machine_id=machines.id`,
    (error, result, fields) => {
            conn.end();
            if (error) throw error;
            if (result.length <= 0) {
                return res
                    .status(404)
                    .end();
            } else {
                return res
                    .status(200)
                    .send({result});
            }
        }
    );
});

module.exports = router;