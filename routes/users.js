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
  			console.log(user);
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
	var listaTajemnic;	
	Tajemnica
	  	.find()
	    .exec( function(err, tajemnice) {
	  		if(err)
				return next(err);
			listaTajemnic=tajemnice;
		});

	User
	  	.find()
	  	.populate('tajemnica')
	  	.exec( function(err, docs) {
	  		if(err)
	  			return next(err);
	  		else {


	  			for(var i=0; i<docs.length; i++) {
	  				var index;
	  				if(docs[i].tajemnica.number<5) 
	  					index = docs[i].tajemnica.number+1;
	  				else
	  					index=1;
	  				console.log('modyfikowany dokument : ',docs[i]);
	  				
		  			docs[i].tajemnica=listaTajemnic[xxx]
		  			docs[i].save(function(err, updated) {
				  		if(err)
				  			return next(err)
				  		console.log('zmiana OK');
				  		});	
		  		
					  		
					  			
	  			}
	  			 //update kazdego recordu z numerem tajemnicy +1
	  		} 			 
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
