var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var fs = require('fs');
var Tajemnica = require('../models/tajemnica');

/* GET home page. */
router.get('/', function(req, res, next) {
  	var messages = req.flash('error');
  	return res.render('index', { messages:messages, hasErrors: messages.length>0});
});




module.exports = router;