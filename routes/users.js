var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Tajemnica = require('../models/tajemnica');
var Group = require('../models/group');



/* GET users listing. /users */
router.get('/', function(req, res, next) {
  var messages = req.flash('error');
  User
  	.find()
  	.populate('tajemnica')
  	.populate('grupa')
  	.exec( function(err, docs) {
  		if(err)
  			return next(err);
  		else  		
    		return res.render('users', { data: docs, messages:messages, hasErrors: messages.length>0 });  
  });
});

/*  user profile /users/:id */
router.get('/profile/:id', function(req, res, next) {
  User
  	.findById(req.params.id) 
  	.populate('tajemnica')
  	.populate('grupa')
  	.exec( function(err, docs) {
  		if(err)
  			return next(err);
  		else
    		return res.render('showProfile', { data: docs });  
  });
});


/* Add user    /users/add    */
router.post('/add', function(req, res, next) {
  	console.log(req.body);
  	if(req.body.email && req.body.name) {	
	  	Tajemnica
	  	.findOne({'number': req.body.tajemnica })
	  	.exec( function(err, tajemnica) {
	  		if(err)
	  			return next(err);
	  		else {
	  			Group
			  	.findById(req.body.grupa)
			  	.exec( function(err, grupa) {
			  		if(err)
			  			return next(err);
			  		else {
			  			console.log(tajemnica,grupa);
			  			var newUser = new User({
						  	email: req.body.email,
						  	name: req.body.name,
						    tel: req.body.tel,
						    tajemnica: tajemnica._id,
						    grupa: grupa._id,
						    joinDate: new Date().getTime()
					  		});
			  			newUser.save(function (err, newUser) {
			  				if(err) {
				                if(err.message.startsWith("E11000"))
				                    req.flash('error', 'Podany e-mail juz istnieje. ');
				                else
				                    req.flash('error', 'Błąd bazy danych. Spróbuj ponownie ');
				                return res.redirect('/users/add');
			  				}
			  				res.status(201);
							return res.redirect('/users/profile/'+newUser._id);
			  			});
			  		} 
			  	});
	  		}	
	 	});
	}
	else {
		var err = new Error('All fields required.');
        err.status = 400;
        req.flash('error', 'All fields required');
        return res.redirect('/users/add');
	}
});

router.get('/add', function(req, res, next) {
	var messages = req.flash('error');

	Tajemnica
  	.find()
  	.exec( function(err, tajemnice) {
  		if(err)
  			return next(err);
  		else {
  			Group
			  	.find()
			  	.exec( function(err, grupy) {
			  		if(err)
			  			return next(err);
			  		else {
			  			return res.render('editProfile', { 'tajemnice': tajemnice, 'grupy': grupy, 
			  				messages:messages, hasErrors: messages.length>0 });  
			  		}
			  	});
  		}	
 	});
});


/* delete /user/delete/:id  */
router.get('/delete/:id', function(req, res, next) {
	User
  	.findById(req.params.id) 
  	.remove()
  	.exec( function(err) {
  		if(err)
  			return next(err);
  		else {
  			req.flash('error', ' Uzytkownik skasowany !');
    		return res.redirect('/');
  		}
  });
});


/* Edit user  */
router.get('/edit', function(req, res, next) {
	
});

router.post('/edit', function(req, res, next) {

});

/* request o zmiane tejemnic /users/zmianaTajemnic  */
//kompletnie nie dzialajacy w obecnej formie trzeba to zrobic z uzyciem promisow
router.get('/zmianaTajemnic', function(req, res, next) {

	function nastepnaTajemnica(tajemnica) {
		//console.log("nastepnaTajemnica");
		var nowaTajemnica;
		if (tajemnica.number<20)
			nowaTajemnica=tajemnica.number+1;
		else
			nowaTajemnica=1;

		return Tajemnica.findOne({'number' : nowaTajemnica}).exec();  
	}
	
	function updateRecord(user) {
			return Tajemnica.findById(user.tajemnica)
			.then(nastepnaTajemnica)
			.then(nextTaj => {
				user.tajemnica = nextTaj._id;
				return user;
			});
	}

	function getUserRecord(userId) {
		console.log("getUserRecord");
		return User
		.findById(userId)
		.exec(function (err,user) {
				if (err) 
					return err;
				else 
					return user; 	
			});
	}

	function updateUserRecords(userId) {
		return getUserRecord(userId)
		.then(updateRecord)
		.then( user => {
			user.save(function (err) {
				console.log('saved');
				if (err) {
					console.log(err);
					return err;
				}
				return user; 
			});
		});
	}

	function updateAllRecords(users) {
		var promises = [];
		for (i=0;i<users.length;i++) {
			userId=users[i]._id;
			promises.push( updateUserRecords(userId));
		}
		return Promise.all(promises);
		// Promise.all(promises)
		// .then( results => {
		// 	return results;
		// })
		// .catch(err => {
		// 	return err;
		// });
	}


	User
	.find()
	.then(updateAllRecords)
	.then(results => {
		console.log("results: ",results);
		req.flash('error', ' Zmiana tajemnic wykonana!');
		return res.redirect('/');
	})
	.catch(err => {
		return next(err);
	});


});



//=======SEEDERY===========================================
router.get('/group/seeder', function(req, res, next) {
  var groups = [
  	new Group({
  		name: "Bł. Michał Czartoryski",
  		opiekun: "59367f240103e51734818597",
 	}),
  	new Group({
  		name: "Św. Faustyna ",
  		opiekun:"59367f240103e51734818598"
 	}),
 	new Group({
  		name: "Św. Wincenty Pallotti",
  		opiekun: "59367f240103e51734818599"
 	})];

var done =0;
	for( var i=0; i<groups.length;i++) {
	    groups[i].save(function (err, res) {
	        done++;
	        if(done===groups.length) //exit();
		        Group.find( function(err, docs) {
					if(err) next(err);
				});
	    });
	}

res.render('index', { title: 'Seeding group completed', data: docs });

});


router.get('/tajemnica/seeder', function(req, res, next) {
  var tajemnice = [
  	new Tajemnica({
 		number : "1",
 		name : "Tajemica Radosna  I - Zwiastowanie",
	}),
  	new Tajemnica({
 		number : "2",
 		name : "Tajemica Radosna  II - Nawiedzenie św. Elżbiety",
	}),
  	new Tajemnica({
		number : "3",
		name : "Tajemica Radosna  III - Narodzenie Jezusa",
	}),
	new Tajemnica({
		number : "4",
		name : "Tajemica Radosna  IV - Ofiarowanie Jezusa w świątyni",
	}),
  	new Tajemnica({
 		number : "5",
 		name : "Tajemica Radosna  V - Znalezienie Jezusa w świątyni",
	}),	
	];


var done =0;
	for( var i=0; i<tajemnice.length;i++) {
	    tajemnice[i].save(function (err, res) {
	        done++;
	        if(done===tajemnice.length) //exit();
		        Tajemnica.find( function(err, docs) {
					if(err) next(err);
				});
	    });
	}

res.render('index', { title: 'Seeding tajemnic completed', data: docs });

});


  				

/*  users seeder. */
router.get('/seeder', function(req, res, next) {
  var users = [
  	new User({
	  	email: "marek@test.pl",
	  	name: "marek",
	    tel: "500600700",
	    tajemnica: '59367bef1893510c646f607d',
	    grupa: "Bł. Michał Czartoryski",
	    joinDate: new Date().getTime()
  	}),
  	new User({
	  	email: "stefan@test.pl",
	  	name: "stefan",
	    tel: "500600701",
	    tajemnica: "59367bef1893510c646f607e",
	    grupa: "Bł. Michał Czartoryski",
	    joinDate: new Date().getTime()
  	}),
  	new User({
	  	email: "jurek@test.pl",
	  	name: "jurek",
	    tel: "500600702",
	    tajemnica: "59367bef1893510c646f607f",
	    grupa: "Bł. Michał Czartoryski",
	    joinDate: new Date().getTime()
  	}),
  	new User({
	  	email: "staszek@test.pl",
	  	name: "staszek",
	    tel: "500600703",
	    tajemnica: "59367bef1893510c646f6080",
	    grupa: "Bł. Michał Czartoryski",
	    joinDate: new Date().getTime()
  	}),

  ];

var done =0;
	for( var i=0; i<users.length;i++) {
	    users[i].save(function (err, res) {
	        done++;
	        if(done===users.length) //exit();
		        User.find( function(err, docs) {
		        	if(err) next(err);
					
				});
	    });
	}

res.render('index', { title: 'Seeding users completed', data: docs });
});


module.exports = router;
