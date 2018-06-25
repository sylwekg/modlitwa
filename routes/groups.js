var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var User = require('../models/user');
var mongoose = require('mongoose');
var path = require('path');
var multer  = require('multer');
var fs = require('fs');

var mid = require('../middleware/login');

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



// GET     /groups listing
router.get('/', mid.requiresOpiekun, function(req, res, next) {
	var messages = req.flash('error');
  	Group
  	.find()
  	.populate('manager')
  	.exec( function(err, docs) {
  		if(err)
  			return next(err);
  		else
    		return res.render('groups', { backButton:true, backLink:"/admin", messages:messages, hasErrors: messages.length>0, data: docs });  
  	});
});

/*  group profile /groups/profile/:id */
router.get('/profile/:id', mid.requiresOpiekun, function(req, res, next) {
	var messages = req.flash('error');

  	User
  	.find({'grupa': req.params.id })
	.populate('tajemnica')
  	.exec( function(err, users) {
		if(err)
			return next(err);
		else {
		  	Group
		  	.findById(req.params.id) 
		  	.populate('manager')
		  	.exec( function(err, group) {
		  		if(err)
		  			return next(err);
		  		else
		    		return res.render('groupProfile', { backButton:true, backLink:"/admin/groups", messages:messages, hasErrors: messages.length>0, groupData: group, usersData: users });  
		  	});
		}
	});
});


// add group
//   /groups/add
router.get('/add', mid.requiresAdmin, function(req, res, next) { 
  	User
  	.find()
  	.exec( function(err, users) {
		if(err)
			return next(err);
		else { 
			return res.render('addGroup', {  usersData: users });
		}
	});
});


router.post('/add', mid.requiresAdmin, upload.single('foto'), function(req, res, next) { 
	console.log(req.body);
	console.log(req.file);

	var foto;
	if(req.file) {
		var ext = path.extname(req.file.originalname)
		if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'&& ext !== '.JPEG' && ext !== '.JPG' && ext !== '.GIF' && ext !== '.PNG' ) {
			req.flash('error', 'Zły format zdjecia, zdjecie nie zostało zmienione.');
		} else {
			foto=req.file.filename;
		}
	}
	else
		foto="avatar.jpg";

	var newGroup = new Group({
	  	name: req.body.groupName,
	  	manager: req.body.manager,
	  	foto: foto,
	    joinDate: new Date().getTime()
		});

	newGroup.save(function (err, newGroup) {
		if(err) 
			return next(err);
		else {
			req.flash('error', 'Dodano nową grupę !');
			return res.redirect('/admin/groups');
		}
	});
});


// edit group
//  /groups/edit/:id
router.get('/edit/:id', mid.requiresAdmin, function(req, res, next) {
  	User
  	.find()   //{'grupa': req.params.id }
	.populate('tajemnica')
  	.exec( function(err, users) {
		if(err)
			return next(err);
		else {
		  	Group
		  	.findById(req.params.id) 
		  	.populate('manager')
		  	.exec( function(err, group) {
		  		if(err)
		  			return next(err);
		  		else
		    		return res.render('editGroupProfile', { backButton:true, backLink:"/admin/groups/profile/"+req.params.id, backArrow: true, groupData: group, usersData: users });  
		  	});
		}
	});
});

//  /groups/edit/:id
router.post('/edit/:id', mid.requiresAdmin, upload.single('foto'), function(req, res, next) {
	console.log(req.body);
	console.log(req.file);

	Group
  	.findById(req.params.id) 
  	.exec( function(err, group) {
  		if(err)
  			return next(err);
  		else {
  			group.manager=req.body.manager;
  			group.name=req.body.groupName;
  			group.updateDate= new Date().getTime();

  			if(req.file) {
				var ext = path.extname(req.file.originalname)
				if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'&& ext !== '.JPEG' && ext !== '.JPG' && ext !== '.GIF' && ext !== '.PNG' ) {
					req.flash('error', 'Zły format zdjecia, zdjecie nie zostało zmienione.');
				} else {
					group.foto=req.file.filename;
				}
			}
			// else
			// 	group.foto="avatar.jpg";

  			group.save( function(err, updatedGroup) {
  				if(err) 
  					return err;
  				else
  					return res.redirect('/admin/groups/profile/'+req.params.id);
    		});
  		}
  	});
});

// delete group
//  /groups/delete/:id
router.get('/delete/:id', mid.requiresAdmin, function(req, res, next) {

	User
	.find({grupa:req.params.id})
	.exec(function(err, users) {
		if(err)
			return next(err)
		else {
			if(users.length>0) {
				req.flash('error', ' Najpierw usun członków grupy !');
    			return res.redirect('/admin/groups/profile/'+req.params.id);
			} else{
				Group
			  	.findById(req.params.id) 
			  	.exec( function(err, group) {
			  		if(err)
			  			return next(err);
			  		else {

			  			var foto=group.foto;
			  			if (foto !== "avatar.jpg") {
			  			 	fs.unlink('public/admin/images/'+foto, (err) => {
			  					if (err) return next(err);
			  					console.log('zdjecie skasowane');
			  				});
			  			}
						group.remove(function(err, group) {
							if(err){
								req.flash('error', ' Błąd w trakcie kasowaia grupy !');
								return next(err);
							}
							else {
								req.flash('error', ' Grupa skasowana !');
								return res.redirect('/admin/groups');	
							}
						});
			  		}
			  	});
			}
		}
	});
});

// add users to group(id)   /groups/addUsers/:id  
router.get('/addUsers/:id', mid.requiresAdmin, function(req, res, next) {
  	var messages = req.flash('error');

  	User
  	.find({grupa : null})
  	.populate('tajemnica')
  	.populate('grupa')
  	.exec( function(err, docs) {
  		if(err)
  			return next(err);
  		else  		
    		return res.render('showUsersToAdd', { backButton:true, backLink:"/admin/groups/profile/"+req.params.id  , group:req.params.id, data: docs, messages:messages, hasErrors: messages.length>0 });  
  	});
});

router.post('/addUsers/:id', mid.requiresAdmin, function(req, res, next) {
	console.log(req.body);

	var p1=new Promise((resolve, reject) => {
		function makeMObject(user) {
	    	return mongoose.Types.ObjectId(user);
		}
		if(Array.isArray(req.body.addUsers))
			resolve(req.body.addUsers.map(makeMObject) ) ;
		else 
			resolve(mongoose.Types.ObjectId(req.body.addUsers) ) ;	
	});

	p1.then(function(val) {
		User
		.update(
			{'_id': { $in: val }}, {grupa:req.params.id}, { multi: true}, function (err, raw) {
			if (err) 
				return next(err);
			console.log('The raw response from Mongo was ', raw);

			if(raw.nModified==0)
	  			req.flash('error', 'Nie dodano użytkowników!');	
	  		else
	  			req.flash('error', ' Dodano do grupy '+ raw.nModified+' użytkowników!');
			return res.redirect('/admin/groups/profile/'+req.params.id);
		});
	});
});

// remove users from group(id)   /groups/removeUsers/:id  
router.get('/removeUsers/:id', mid.requiresAdmin, function(req, res, next) {
  	var messages = req.flash('error');

  	User
  	.find({grupa : req.params.id})
  	.populate('tajemnica')
  	.populate('grupa')
  	.exec( function(err, docs) {
  		if(err)
  			return next(err);
  		else  		
    		return res.render('showUsersToRemove', {backButton:true, backLink:"/admin/groups/profile/"+req.params.id  , group:req.params.id, data: docs, messages:messages, hasErrors: messages.length>0 });  
  	});
});

router.post('/removeUsers/:id', mid.requiresAdmin, function(req, res, next) {
	console.log(req.body);

	var p1=new Promise((resolve, reject) => {
		function makeMObject(user) {
	    	return mongoose.Types.ObjectId(user);
		}
		if(Array.isArray(req.body.addUsers))
			resolve(req.body.addUsers.map(makeMObject) ) ;
		else 
			resolve(mongoose.Types.ObjectId(req.body.addUsers) ) ;

	});

	p1.then(function(val) {
		User
		.update(
			{'_id': { $in: val }}, {grupa:null}, { multi: true}, function (err, raw) {
			if (err) 
				return next(err);
			console.log('The raw response from Mongo was ', raw);
	  		req.flash('error', ' Usunięto z grupy '+ raw.nModified+' użytkowników!');
			return res.redirect('/admin/groups/profile/'+req.params.id);
		});
	});
});


module.exports = router;