var express = require('express');
var router = express.Router();
var Group = require('../models/group');


/* GET home page. */
router.get('/', function(req, res, next) {
  var messages = req.flash('error');
  return res.render('index', { messages:messages, hasErrors: messages.length>0});
});


//groups listing
router.get('/groups', function(req, res, next) {
  Group
  	.find()
  	.populate('opiekun')
  	.exec( function(err, docs) {
    	return res.render('groups', { title: 'Grupy : ', data: docs });  
  });

});



module.exports = router;