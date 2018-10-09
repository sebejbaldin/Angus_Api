const express = require("express");
const mysql = require("mysql");
const jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
const config = require("./config"); // get config file
const verifyToken = require("./verifyToken");

var router = express.Router();

/* router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(bodyParser.json()); */
const mysqlConf = {
  host: config.hostname,
  user: config.username,
  password: config.password,
  database: config.db_name
};

/**
 * Create new authorization token which is composed by 2 identifier
 * for the profile (id and email).
 * This API create the connection to the database MYSQL and get the
 * identifier. If something went wrong it returns the 401 page.
 * After the retriving the API create a new JWT token and return it.
 */
router.post("/login", (req, res) => {
  let conn = mysql.createConnection(mysqlConf);
  conn.connect(function(err) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }
    console.log(
      "[AUTH:LOGIN] (" +
        new Date().toLocaleString() +
        ") ~ trying to get access for user " +
        req.body.email +
        " from " +
        req.connection.remoteAddress +
        " [" +
        conn.threadId +
        "]"
    );
  });

  conn.query(
    `SELECT accounts.id, accounts.email 
        FROM shadow JOIN accounts ON shadow.id=accounts.id 
        WHERE email = ? AND passwd = PASSWORD( ? );`,
    [req.body.email, req.body.password],
    (error, result, fields) => {
      conn.end();
      // if there are error throws
      if (error) throw error;
      // otherwise proceed with the authentication
      if (result.length <= 0) {
        // if no result the credentials are not in the database, so the user will be not authenticated
        return res
          .status(401)
          .json({ auth: false })
          .end();
      } else {
        // otherwise a token will be created and provided to the client
        var token = jwt.sign(
          { id: result[0].id, email: result[0].email },
          config.secret,
          { expiresIn: 86400 } // expires in 24 hours
        );
        return res
          .status(200)
          .json({ auth: true, token: token })
          .end();
      }
    }
  );
});

/**
 * Allow to retrive all the user information from the server, the info
 * are used only to visualize them to the setting view and allow to
 * change them. The information retrived doesn't contains any password
 * or sensitive information. To check if is a user which try to retrive
 * the information is used a middleware called: verifyToken which check
 * if the token is right created
 */
router.get("/user", verifyToken, function(req, res, next) {
  let conn = mysql.createConnection(mysqlConf);
  conn.connect(function(err) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }
    console.log(
      "[AUTH:USER] (" +
      new Date().toLocaleString() +
      ") ~ trying to get access for user " +
        req.userEmail +
        " from " +
        req.connection.remoteAddress +
        " [" +
        conn.threadId +
        "]"
    );
  });
  conn.query(
    `SELECT 
        accounts.id, accounts.username, accounts.name, accounts.surname, accounts.email, accounts.grade, accounts.profileImg   
        FROM accounts 
        WHERE accounts.email = ? AND accounts.id = ?;`,
    [req.userEmail, req.userId],
    (error, result, fields) => {
      conn.end();
      if (error) throw error;
      if (result.length <= 0) {
        //no data received, so the user have no valid credentials
        return res.status(401).end();
      } else {
        return res.status(200).send({
          auth: true,
          username: result[0].username,
          name: result[0].name,
          surname: result[0].surname,
          email: result[0].email,
          grade: result[0].grade,
          profileImg: result[0].profileImg
        });
      }
    }
  );
});

module.exports = router;
