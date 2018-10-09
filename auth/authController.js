const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const config = require('../config'); // get config file
const verifyToken = require('./verifyToken');

var router = express.Router();

/* router.use(bodyParser.urlencoded({
    extended: false
})); */
const mysqlConf = {
    host: config.mysql_config.hostname,
    port: config.mysql_config.port,
    user: config.mysql_config.username,
    password: config.mysql_config.password,
    database: config.mysql_config.database
};

/**
 * Creates new authorization token composed by 2 identifier of the profile (id and email).
 * This API connect to the database searching for the credentials provided, 
 * if they are found it creates a new token and provides it to the one that performed the request.
 * Otherwise it returns the 401 page.
 */
router.post('/login', async (req, res) => {
    let conn = mysql.createConnection(mysqlConf);
    conn.connect((err) => {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return res
                .status(500)
                .end('Server error.');
        }
        console.log(
          '[AUTH:tokenRequest]\t(' +
            new Date().toLocaleString() +
            ')\ttrying to get access for user ' +
            req.body.email +
            ' from\t' +
            req.connection.remoteAddress +
            ' [' +
            conn.threadId +
            ']'
        );
    });

    conn.query(`SELECT accounts.id, accounts.email 
        FROM shadow JOIN accounts ON shadow.id=accounts.id 
        WHERE email = ? AND passwd = PASSWORD( ? );`,
        [req.body.email, req.body.password],
        (error, result, fields) => {
            conn.end();
            // if there are error throws
            if (error)
                throw error;
            // otherwise proceed with the authentication
            if (result.length <= 0) {
                // if no result the credentials are not in the database, so the user will be not authenticated
                return res
                    .status(401)
                    .json({ 
                        auth: false 
                    })
                    .end();
            } else {
                // otherwise a token will be created and provided to the client
                let token = jwt.sign({ 
                    id: result[0].id, 
                    email: result[0].email 
                    },
                    config.secret, { 
                        expiresIn: 86400 
                    } // expires in 24 hours
                );
                return res
                    .status(200)
                    .json({ 
                        auth: true, 
                        token: token 
                    })
                    .end();
            }
        }
    );
});

/**
 * This API retrieves all the information of the user that have performed the request. 
 * These data are being used in the user profile view, this data does not include the user password.
 * This function is protected by the verifyToken middleware, that checks if the token is valid.
 */
router.get('/user', verifyToken, function (req, res, next) {
    let conn = mysql.createConnection(mysqlConf);
    conn.connect((err) => {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return res
                .status(500)
                .end('Server error.');
        }
        console.log(
          '[AUTH:userinfoRequest]\t(' +
            new Date().toLocaleString() +
            ')\ttrying to get access for user ' +
            req.userEmail +
            ' from\t' +
            req.connection.remoteAddress +
            ' [' +
            conn.threadId +
            ']'
        );
    });
    conn.query(`SELECT accounts.id, accounts.username, accounts.name, accounts.surname, accounts.email, accounts.grade, accounts.profileImg   
        FROM accounts 
        WHERE accounts.email = ? AND accounts.id = ?;`,
        [req.userEmail, req.userId],
        (error, result, fields) => {
            conn.end();
            if (error)
                throw error;
            if (result.length <= 0) {
                //no data received, so the user have no valid credentials
                return res
                    .status(401)
                    .end();
            } else {
                return res
                    .status(200)
                    .send({
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