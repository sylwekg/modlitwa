var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var fs = require('fs');
var Tajemnica = require('../models/tajemnica');


/* GET home page. */
router.get('/', function(req, res, next) {
	if (process.env.NODE_ENV == 'prod') {
		console.log('production mode with separate react front end app');
		return res.redirect('/');
	}
	else {
		console.log('development mode with integrated server-rendered front end');
		var messages = req.flash('error');
		return res.render('index', { messages:messages, hasErrors: messages.length>0});
	}
});


module.exports = router;