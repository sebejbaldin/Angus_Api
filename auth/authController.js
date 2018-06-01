var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var verifyToken = require('./verifyToken');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

/**
 * Configure JWT
 */
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get config file

router.post('/login', (req, res) => {
    // eseguo la verifica delle credenziali

    // check if the password is valid
    var passwordIsValid = (req.body.password == "75359514565852" && req.body.username == "sebaaaa");
    if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });

    // if user is found and password is valid
    // create a token
    var token = jwt.sign({ id: 1, username: "sebaaaa" }, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });

    // return the information including token as JSON
    res.status(200).send({ auth: true, token: token });
});


router.get('/me', verifyToken, function(req, res, next) {

    res.status(200).send({
        id: 1, 
        username: "sebaaa", 
        fullName: "Sebastiano Emy Yari Baldin" 
    });

});

module.exports = router;