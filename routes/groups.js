var express = require('express');
var router = express.Router();
var Group = require('../models/group');
var User = require('../models/user');
var mongoose = require('mongoose');

// GET     /groups listing
router.get('/', function(req, res, next) {
	var messages = req.flash('error');
  	Group
  	.find()
  	.populate('opiekun')
  	.exec( function(err, docs) {
  		if(err)
  			return next(err);
  		else
    		return res.render('groups', { messages:messages, hasErrors: messages.length>0, data: docs });  
  	});
});

/*  group profile /groups/profile/:id */
router.get('/profile/:id', function(req, res, next) {
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
		  	.populate('opiekun')
		  	.exec( function(err, group) {
		  		if(err)
		  			return next(err);
		  		else
		    		return res.render('groupProfile', { messages:messages, hasErrors: messages.length>0, groupData: group, usersData: users });  
		  	});
		}
	});

});


// add group
//   /groups/add
router.get('/add', function(req, res, next) { 
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


router.post('/add', function(req, res, next) { 

	var newGroup = new Group({
	  	name: req.body.groupName,
	  	opiekun: req.body.opiekun,
	    joinDate: new Date().getTime()
		});

	newGroup.save(function (err, newGroup) {
		if(err) 
			return next(err);
		else {

			return res.redirect('/groups');
		}
	});
});


// edit group
//  /groups/edit/:id
router.get('/edit/:id', function(req, res, next) {
  	User
  	.find()   //{'grupa': req.params.id }
	.populate('tajemnica')
  	.exec( function(err, users) {
		if(err)
			return next(err);
		else {
		  	Group
		  	.findById(req.params.id) 
		  	.populate('opiekun')
		  	.exec( function(err, group) {
		  		if(err)
		  			return next(err);
		  		else
		    		return res.render('editGroupProfile', { backArrow: true, groupData: group, usersData: users });  
		  	});
		}
	});

});

//  /groups/edit/:id
router.post('/edit/:id', function(req, res, next) {
	Group
  	.findById(req.params.id) 
  	.exec( function(err, group) {
  		if(err)
  			return next(err);
  		else {
  			group.opiekun=req.body.opiekun;
  			group.name=req.body.groupName;
  			group.save( function(err, updatedGroup) {
  				if(err) 
  					return err;
  				else
  					return res.redirect('/groups/profile/'+req.params.id);
    		});
  		}
  	});
});

// delete group
//  /groups/delete/:id
router.get('/delete/:id', function(req, res, next) {

	User
	.find({grupa:req.params.id})
	.exec(function(err, users) {
		if(err)
			return next(err)
		else {
			if(users.length>0) {
				req.flash('error', ' Najpierw usun członków grupy !');
    			return res.redirect('/groups/profile/'+req.params.id);
			} else{
				Group
			  	.findById(req.params.id) 
			  	.remove()
			  	.exec( function(err) {
			  		if(err)
			  			return next(err);
			  		else {
			  			req.flash('error', ' Grupa skasowana !');
			    		return res.redirect('/groups');
			  		}
			  	});
			}
		}
	});






});

// add users to group to group(id)   /groups/addUsers/:id  
router.get('/addUsers/:id', function(req, res, next) {
  	var messages = req.flash('error');

  	User
  	.find({grupa : null})
  	.populate('tajemnica')
  	.populate('grupa')
  	.exec( function(err, docs) {
  		if(err)
  			return next(err);
  		else  		
    		return res.render('showUsersToAdd', { group:req.params.id, data: docs, messages:messages, hasErrors: messages.length>0 });  
  	});

});

router.post('/addUsers/:id', function(req, res, next) {
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
		User.
		find({'_id': { $in: val }}, function(err, users){
			if(err)
	  			return next(err);
	  		else {
	  			users.map((user)=>{
	  				user.grupa=req.params.id;
	  				user.save();
	  			});
	  			console.log(users);
	  			req.flash('error', ' Dodano '+ users.length+' użytkowników!');	
				return res.redirect('/groups/profile/'+req.params.id);
	  		}
		});
	});
});

// remove users from group(id)   /groups/removeUsers/:id  
router.get('/removeUsers/:id', function(req, res, next) {
  	var messages = req.flash('error');

  	User
  	.find({grupa : req.params.id})
  	.populate('tajemnica')
  	.populate('grupa')
  	.exec( function(err, docs) {
  		if(err)
  			return next(err);
  		else  		
    		return res.render('showUsersToRemove', { group:req.params.id, data: docs, messages:messages, hasErrors: messages.length>0 });  
  	});

});

router.post('/removeUsers/:id', function(req, res, next) {
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
		User.
		find({'_id': { $in: val }}, function(err, users){
			if(err)
	  			return next(err);
	  		else {
	  			users.map((user)=>{
	  				user.grupa=null;
	  				user.save();
	  			});
	  			console.log(users);
	  			req.flash('error', ' Usunięto '+ users.length+' użytkowników!');	
				return res.redirect('/groups/profile/'+req.params.id);
	  		}
		});
	});

});




module.exports = router;