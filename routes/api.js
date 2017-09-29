var express = require('express');
var	router  = express.Router();
var	ejwt    = require('express-jwt');

var _    	= require('lodash');
var jwt 	= require('jsonwebtoken');

var User = require('../models/user'),
    fs = require('fs'),
    path = require('path');
var Tajemnica = require('../models/tajemnica');
var Group = require('../models/group');


config = {
  "secret": "szukajcie a znajdziecie",
  "audience": "nodejs-jwt-auth",
  "issuer": "https://modlitwaonline.pl"
};


//protected routes Validate access_token
var jwtCheck = ejwt({
  secret: config.secret,
  audience: config.audience,
  issuer: config.issuer
});


// Check for scope
function requireScope(scope) {
  return function (req, res, next) {
    var has_scopes = req.user.scope === scope;
    if (!has_scopes) { 
        res.sendStatus(401); 
        return;
    }
    next();
  };
}

// routes /api/protected
router.use('/protected', jwtCheck, requireScope('full_access'));

router.get('/protected/random-quote', function(req, res) {
  res.status(200).send({message:"protected scope response"});
});

//get user profile  /api/protected/users/:id
router.get('/protected/users/:id', function(req, res) {
  User
    .findById(req.params.id) 
    .populate('tajemnica')
    .populate('grupa')
    .exec( function(err, docs) {
      if(err)
        return res.status(400).send({ message:err.message});
      else
        return res.status(201).send({ user: docs });
  });
});


// protected/EditProfileData
router.get('/protected/EditProfileData', function(req, res) {
  Tajemnica
    .find()
    .sort({number:'asc'})
    .exec( function(err, tajemnice) {
      if(err)
        return res.status(400).send({ message:err.message});
      else {
        Group
        .find()
        .sort({name:'asc'})
        .exec( function(err, grupy) {
          if(err)
            return res.status(400).send({ message:err.message});
          else {

            return res.status(201).send({ tajemnice: tajemnice, grupy:grupy  });

            // return res.render('editProfile', { backButton:true, 
            //   backLink:"/admin/users/profile/"+req.params.id , 
            //   data: docs, 'tajemnice': tajemnice, 'grupy': grupy});  
          }
        });
      } 
  });
});


// routes /api - NOT PROTECTED

router.get('/avatars/:id', function(req, res) {
    var filePath = path.join(__dirname, '../public/images/'+req.params.id);
    return res.sendFile(filePath,function (err) {
        if (err) {
          console.log(err);
          return res.status(400).send({message:"Avatar image not available"});
        } 
    }); 
});


function createIdToken(user) {
  return jwt.sign(_.omit(user, 'password'), config.secret, { expiresIn: 60*60 });
}

function createAccessToken() {
  return jwt.sign({
    iss: config.issuer,
    aud: config.audience,
    exp: Math.floor(Date.now() / 1000) + (60*60),
    scope: 'full_access',
    sub: "modlitwaonline",
    jti: genJti(), // unique identifier for the token
    alg: 'HS256'
  }, config.secret);
}

// Generate Unique Identifier for the access token
function genJti() {
  let jti = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 16; i++) {
      jti += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return jti;
}

//login user
// The body must have:
// username: The username
// password: The password
router.post('/sessions/create', function(req, res) {
  if (req.body.username && req.body.password) {
      User.authenticate(req.body.username, req.body.password, function (error, user) {
          if(error || !user) {
              return res.status(401).send({message:"The username or password don't match"});
          } else {
            res.status(201).send({
            id_token: createIdToken(user),
            access_token: createAccessToken(),
            user: user
            });
          }
      });
  } else {
      return res.status(400).send({message:"You must send the username and the password"});
  }
});


module.exports = router;