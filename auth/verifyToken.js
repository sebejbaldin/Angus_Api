var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config'); // get our config file

function verifyToken(req, res, next) {

  // check header or url parameters or post parameters for token
  let token = req.headers['x-access-token'];
  if (!token) 
    return res
      .status(403)
      .send({ 
        auth: false, 
        message: 'No token provided.' 
      });

  // verifies secret and checks exp
  jwt.verify(token, config.jwt_secret, function(err, decoded) {
    if (err) 
      return res
        .status(401)
        .send({ 
          auth: false, 
          message: 'Failed to authenticate token.' 
        });

    // if everything is good, save the data to the request for use in the /api/auth/user route
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  });
}

module.exports = verifyToken;