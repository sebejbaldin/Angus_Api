const express = require("express");
const mysql = require("mysql");
const verifyToken = require("../auth/verifyToken");
const jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
const config = require("../config"); // get config file

var router = express.Router();

const mysqlConf = {
  host: config.mysql_config.hostname,
  port: config.mysql_config.port,
  user: config.mysql_config.username,
  password: config.mysql_config.password,
  database: config.mysql_config.database
};

/**
 * Get the area information by id
 */
router.get("/area/:id", verifyToken, function(req, res, next) {
  let conn = mysql.createConnection(mysqlConf);
  conn.connect(function(err) {
    if (err) {
      console.log("error connecting: " + err.stack);
      return;
    }
    console.log(
      "[STRUCT:request]\t(" +
        new Date().toLocaleString() +
        ")\ttrying to get data for user " +
        req.userEmail +
        " from\t" +
        req.connection.remoteAddress +
        " [" +
        conn.threadId +
        "]"
    );
  });
  conn.query(
    `
    SELECT 
        production_lines.id as 'pLineId',
        production_lines.name as 'pLineName',
        machines.id as 'machineId',
        machines.sector as 'machineSector',
        machines.name as 'machineName',
        sensors.id as 'sensorId',
        sensors.type as 'sensorType'
    FROM establishments 
    JOIN production_lines   ON establishments.id=production_lines.establishment_id 
    JOIN machines           ON machines.production_line_id=production_lines.id 
    JOIN sensors            ON sensors.machine_id=machines.id
    WHERE production_lines.id=?`,
    [req.params.id],
    (error, result, fields) => {
      conn.end();
      if (error) throw error;
      if (result.length <= 0) {
        return res.status(404).end();
      } else {
        return res
          .status(200)
          .json({ result })
          .end();
      }
    }
  );
});

/**
 * Get all the avaiable area
 */
router.get("/areas", verifyToken, function(req, res, next) {
  let conn = mysql.createConnection(mysqlConf);
  conn.connect(function(err) {
    if (err) {rs
      
      console.log("error connecting: " + err.stack);
      return;
    }
    console.log(
      "[STRUCT:request]\t(" +
        new Date().toLocaleString() +
        ")\ttrying to get data for user " +
        req.userEmail +
        " from\t" +
        req.connection.remoteAddress +
        " [" +
        conn.threadId +
        "]"
    );
  });
  conn.query(
    `
    SELECT DISTINCT 
        production_lines.id as 'pLineId', 
        production_lines.name as 'pLineName' 
    FROM establishments 
    JOIN production_lines ON establishments.id=production_lines.establishment_id`,
    (error, result, fields) => {
      conn.end();
      if (error) throw error;
      if (result.length <= 0) {
        return res.status(404).end();
      } else {
        return res
          .status(200)
          .json({ result })
          .end();
      }
    }
  );
});

module.exports = router;
