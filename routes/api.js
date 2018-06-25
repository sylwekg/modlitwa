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

var utils = require('../src/utils');
var path = require('path');
var multer  = require('multer');

var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, 'public/admin/images/')
  },
  filename: function(req, file, callback) {
    console.log(file)
    callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

var upload = multer({ storage: storage });


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
        return res.status(400).send({ message:err.message });
      else
        return res.status(201).send({ user: docs });
  });
});

// api/protected/users/edit/:id
router.post('/protected/users/edit/:id', upload.any(), function(req, res) {
    console.log(req.body);
    console.log(req.file);

    var updatedUser = {
        name : req.body.name, 
        email : req.body.email, 
        tel : req.body.tel,
        updateDate: new Date().getTime(),
      };

    if(req.files[0]) {
      var ext = path.extname(req.files[0].originalname)
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'&& ext !== '.JPEG' && ext !== '.JPG' && ext !== '.GIF' && ext !== '.PNG' ) {
        return res.status(400).send({ message:'Wrong image format. '});
      } else {
        if(req.body.imageUrl){
          var imageBuffer = utils.decodeBase64Image(req.body.imageUrl);
          fs.writeFile(req.files[0].path, imageBuffer.data, function(err) { 
            if(err)
              return(err);
            console.log('img saved succesfuly');
          });
        }
        updatedUser.foto=req.files[0].filename;
      }
    }

    User
      .update({ _id  : req.params.id }, updatedUser, function (err, raw) {
      if (err) {
        if(err.message.startsWith("E11000"))
          return res.status(400).send({ message:'Provided e-mail already exist. '});
        else
          return res.status(400).send({ message:'DB error. Try again. '});
      }
      console.log('The raw response from Mongo was ', raw);
      return res.status(201).send({ resp:raw  });
    }); 
});

// api/protected/getProfileData
router.get('/protected/getProfileData', function(req, res) {
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

//get group profile  /api/protected/groups/:id
router.get('/protected/groups/:id', function(req, res) {
  User
    .find({'grupa': req.params.id })
    .populate('tajemnica')
    .exec( function(err, users) {
    if(err)
      return res.status(400).send({ message:err.message });
    else {
        Group
        .findById(req.params.id) 
        .populate('manager')
        .exec( function(err, group) {
          if(err)
            return res.status(400).send({ message:err.message });
          else
            return res.status(201).send({ users: users, group: group  });
        });
    }
  });
});

// DELETE MESSAGES: api/protected/messages
router.post('/protected/messages/delete', function(req, res) {
  User
  .findById(req.body.userId)
  .exec( function (err, user) {
    if(err)
      return res.status(400).send({ message:err.message });
    else {
      //find and remove record from table
      user.messages.forEach( (message, index) => {
        if(message._id == req.body.msgId) {
          user.messages.splice(index,1);
          let updatedUser = { messages : user.messages };

          User
          .update({ _id  : req.body.userId }, updatedUser, function (err, raw) {
            if (err) {
              if(err.message.startsWith("E11000"))
                return res.status(400).send({ message:'Provided e-mail already exist. '});
              else
                return res.status(400).send({ message:'DB error. Try again. '});
            }
            console.log('The raw response from Mongo was ', raw);
            return res.status(201).send({ resp:raw  });
          }); 
        }
      }); 
    }
  });
});

// SET READ MESSAGE: api/protected/messages
router.post('/protected/messages/setRead', function(req, res) {
  User
  .findById(req.body.userId)
  .exec( function (err, user) {
    if(err)
      return res.status(400).send({ message:err.message });
    else {
      //find and remove record from table
      user.messages.forEach( (message, index) => {
        if(message._id == req.body.msgId) {
          user.messages[index].read=true;
          let updatedUser = { messages : user.messages };

          User
          .update({ _id  : req.body.userId }, updatedUser, function (err, raw) {
            if (err) {
              if(err.message.startsWith("E11000"))
                return res.status(400).send({ message:'Provided e-mail already exist. '});
              else
                return res.status(400).send({ message:'DB error. Try again. '});
            }
            console.log('The raw response from Mongo was ', raw);
            return res.status(201).send({ resp:raw  });
          }); 
        }
      }); 
    }
  });
});


// routes /api - NOT PROTECTED

router.get('/avatars/:id', function(req, res) {
    var filePath = path.join(__dirname, '../public/admin/images/'+req.params.id);
    return res.sendFile(filePath,function (err) {
        if (err) {
          console.log(err.message);
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