var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var fs = require('fs');
var Tajemnica = require('../models/tajemnica');
var mid = require('../middleware/login');


/* GET page  /admin */
router.get('/',mid.requiresAdmin, function(req, res, next) {
  	var messages = req.flash('error');
  	return res.render('admin', { messages:messages, hasErrors: messages.length>0});
});


//import danych z pliku (wykonac na początku na swieżej bazie)
router.get('/seeder/tajemnice', function(req, res, next) {
	
	fs.readFile('./seeders/tajemnice.json',  'utf8', (err, data) => {
	    if (err) 
	    	return next(err);
	  	tajemnice=JSON.parse(data);
		Tajemnica.insertMany(tajemnice, function(err, docs) {
		    if (err) {
		    	return next(err);
		    	// req.flash('error', err);
		    	// return res.redirect('/');
		    }
		    console.log('imported '+docs.length+' docs');
		    req.flash('error', 'imported '+docs.length+' docs');
		    return res.redirect('/');
		});	  	
	});
});


module.exports = router;