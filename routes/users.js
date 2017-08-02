module.exports = function(io) {

	var express = require('express');
	var router = express.Router();
	var path = require('path');
	var multer  = require('multer');
	var fs = require('fs');
	var schedule = require('node-schedule');

	var User = require('../models/user');
	var Tajemnica = require('../models/tajemnica');
	var Group = require('../models/group');
	var Global = require('../models/global');

	var sendEmailToAll = require('../src/sendEmailToAll');

	var storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, 'public/images/')
		},
		filename: function(req, file, callback) {
			console.log(file)
			callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
		}
	});

	var upload = multer({ storage: storage });


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
	    		return res.render('users', { backButton:true, backLink:"/", data: docs, messages:messages, hasErrors: messages.length>0 });  
	  });
	});

	/*  user profile /users/profile/:id */
	router.get('/profile/:id', function(req, res, next) {
		var messages = req.flash('error');

	  User
	  	.findById(req.params.id) 
	  	.populate('tajemnica')
	  	.populate('grupa')
	  	.exec( function(err, docs) {
	  		if(err)
	  			return next(err);
	  		else
	    		return res.render('showProfile', { backButton:true, backLink:"/users" ,data: docs , messages:messages, hasErrors: messages.length>0});  
	  });
	});


	/* Add user    /users/add    */
	router.post('/add',upload.single('foto'), function(req, res, next) {
	  	console.log(req.body);
	  	if(req.body.email && req.body.name) {	
		  	Tajemnica
		  	.findOne({'number': req.body.tajemnica })
		  	.exec( function(err, tajemnica) {
		  		if(err)
		  			return next(err);
		  		else {
	  				var foto, grupa;
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

		  			if(req.body.grupa==='0')
						grupa= null;
					else
						grupa= req.body.grupa;

		  			var newUser = new User({
					  	email: req.body.email,
					  	name: req.body.name,
					    tel: req.body.tel,
					    tajemnica: tajemnica._id,
					    grupa: grupa,
					    foto: foto,
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
	  	.sort({number:'asc'})
	  	.exec( function(err, tajemnice) {
	  		if(err)
	  			return next(err);
	  		else {
	  			Group
			  	.find()
			  	.sort({name:'asc'})
			  	.exec( function(err, grupy) {
			  		if(err)
			  			return next(err);
			  		else {
			  			//grupy.unshift("bez grupy");
			  			return res.render('addProfile', { backButton:true, backLink:"/users" ,'tajemnice': tajemnice, 'grupy': grupy, 
			  				messages:messages, hasErrors: messages.length>0 });  
			  		}
			  	});
	  		}	
	 	});
	});


	/* delete /users/delete/:id  */
	router.get('/delete/:id', function(req, res, next) {
		User
	  	.findById(req.params.id) 
	  	.exec( function(err, usr) {
	  		if(err)
	  			return next(err);
	  		else {
	  			var foto=usr.foto;
	  			if (foto !== "avatar.jpg") {
	  			 	fs.unlink('public/images/'+foto, (err) => {
	  					if (err) return next(err);
	  					console.log('zdjecie skasowane');
	  				});
	  			}
				usr.remove(function(err, usr) {
					if(err){
						req.flash('error', ' Błąd w trakcie kasowaia profilu !');
						return next(err);
					}
					else {
						req.flash('error', ' Profil skasowany !');
						return res.redirect('/');	
					}
				});
	  		}
	  	});
	});


	/* Edit user   /users/edit/:id     */
	router.get('/edit/:id', function(req, res, next) {
		User
	  	.findById(req.params.id) 
	  	.populate('tajemnica')
	  	.populate('grupa')
	  	.exec( function(err, docs) {
	  		if(err)
	  			return next(err);
	  		else {
				Tajemnica
			  	.find()
			  	.sort({number:'asc'})
			  	.exec( function(err, tajemnice) {
			  		if(err)
			  			return next(err);
			  		else {
			  			Group
					  	.find()
					  	.sort({name:'asc'})
					  	.exec( function(err, grupy) {
					  		if(err)
					  			return next(err);
					  		else {
					  			//grupy.unshift("bez grupy");
					  			return res.render('editProfile', { backButton:true, backLink:"/users/profile/"+req.params.id , data: docs, 'tajemnice': tajemnice, 'grupy': grupy});  
					  		}
					  	});
			  		}	
			 	});
	  		}
	    });
	});

	router.post('/edit/:id', upload.single('foto'), function(req, res, next) {
		console.log(req.body);
		console.log(req.file);

		User
	  	.findById(req.params.id) 
	  	.exec( function(err, user) {
	  		if(err)
	  			return next(err);
	  		else {
	  			user.name=req.body.name;
	  			user.email=req.body.email;
				user.tel=req.body.tel;
				user.tajemnica=req.body.tajemnica;
				user.updateDate= new Date().getTime();

				if(req.body.grupa==="0")
					user.grupa=null;
				else
					user.grupa=req.body.grupa;	

				if(req.file) {
					var ext = path.extname(req.file.originalname)
					if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'&& ext !== '.JPEG' && ext !== '.JPG' && ext !== '.GIF' && ext !== '.PNG' ) {
						req.flash('error', 'Zły format zdjecia, zdjecie nie zostało zmienione.');
					} else {
						user.foto=req.file.filename;
					}
				}
				// else
				// 	user.foto="avatar.jpg";

	  			user.save( function(err, updatedUser) {
	  				if(err) 
	  					return next(err);
	  				else
	  					return res.redirect('/users/profile/'+req.params.id);
	    		});
	  		}
	  	});
	});


	/* request o zmiane tejemnic /users/zmianaTajemnic  */
	router.get('/zmianaTajemnic', function(req, res, next) {
		var messages = req.flash('error');
		console.log(schedule.scheduledJobs);
		
		Global
	  	.findOne({name:'default'})
	  	.exec( function(err, doc) {
	  		if(err) {
	  			console.log('brak ustawien standardowych');
	  			return next(err);
	  		}
	  		else {
	  			console.log(doc);
	  			if(doc) {
	  				if(Object.keys(schedule.scheduledJobs).length === 0 ) {
	  					// konwersja czasu z lokalnego do UTC przed zapisaniem do bazy
			  			var date = new Date(doc.dataZmiany);
			  			var loc_d = date.getTimezoneOffset()*60000;
			  			console.log('ladowanie eventu z bazy');
						schedule.scheduleJob(Date.parse(date)+loc_d, function(){
						  	console.log('Wykonanie funkcji zmiany tajemnic');
						  	//.............
						});
	  				}
	  			}
	  			return res.render('zmianaTajemnic', { backButton:true, backLink:"/", data: doc, messages:messages, hasErrors: messages.length>0 });
	  		} 			  
		}); 
	});

	//aktualizacja daty zaplanowanej dla zmiany tajemnic
	router.post('/zmianaTajemnic/update', function(req, res, next) {
		console.log("formularz przysłał",req.body);

		Global
	  	.findOne({name:'default'})
	  	.exec( function(err, docs) {
	  		if(err)
	  			return next(err);
	  		else {
	  			
	  			if(docs) 
	  				docs.remove();
	  			// konwersja czasu z lokalnego do UTC przed zapisaniem do bazy
	  			var d = new Date(req.body.date);
	  			var loc_d = d.getTimezoneOffset()*60000;

	  			var newSetting = new Global({
	  				name : "default",
	  				powiadomienieEmail: (req.body.powiadomienieEmail=="on") ? true : false,
	    			powtarzaj: req.body.powtarzaj,
	    			dataZmiany: new Date(Date.parse(req.body.date)+loc_d),
	    			updateDate: new Date().getTime(),
	  			});

	  			newSetting.save(function (err, item) {
	  				if(err) 
						return next(err);
					else{
						console.log('do bazy zapisano: ',item);
						req.flash('error', ' Zapisano zmiany!');
						return res.redirect('/users/zmianaTajemnic');
					}
				});

	  			
				//setting scheduler to single date in future
				if(req.body.powtarzaj==0) {
					console.log('scheduler single date');

					//kasowanie wszystkich poprzednich zaschedulowanych eventow
					if(schedule.scheduledJobs) {
						for (x in schedule.scheduledJobs) {
							schedule.scheduledJobs[x].cancel();
						}
					}

					var date = new Date(req.body.date);
					schedule.scheduleJob(Date.parse(date)+loc_d, function(){
					  	
					  	console.log('Wykonanie funkcji zmiany tajemnic');

					  	User.zmianaTajemnic(function(error, result) {
					  		if(error) {
					  			console.log('Błąd w trakcie zmiany tajemnic !')
					  			req.flash('error', ' Błąd w trakcie zmiany tajemnic !');
					  		}
					  		else {
					  			console.log('Zmiana tajemnic wykonana')
					  			req.flash('error', ' Zmiana tajemnic wykonana');
					  			//powiadomienie mailowe o wykonaniu zmiany
					  			sendEmailToAll(io);
					  		}
					  	});
					});
				}

				//scheduler reccurence
				if(req.body.powtarzaj>0) {
					console.log('scheduler reccurence not yet implemented');
				}
	  		}	
		});  
	});


	//natychmiastowa zmiana tajemnic
	router.get('/zmianaTajemnic/now', function(req, res, next) {

		User.zmianaTajemnic(function(error, result) {
	  		if(error) {
	  			console.log('Błąd w trakcie zmiany tajemnic !')
	  			req.flash('error', ' Błąd w trakcie zmiany tajemnic !');
	  			return res.redirect('/');
	  		}
	  		else {
	  			console.log('Zmiana tajemnic wykonana')
	  			req.flash('error', ' Zmiana tajemnic wykonana');
	  			sendEmailToAll(io);
	  			return res.redirect('/');
	  		}
	  	});
	});

	//emailing /users/mailNotificaton
	router.get('/mailNotification', function(req, res, next) {
		var messages = req.flash('error');
		//load data
		//.........

		return res.render('mailNotification', { backButton:true, backLink:"/", messages:messages, hasErrors: messages.length>0 });

	});


	//emailing /users/mailNotificaton
	router.post('/mailNotification', function(req, res, next) {
		console.log('fake data save: ',req.body);
		//..........
		return res.render('mailNotification');

	});

	//OPCJA #1 wysylanie ze zwykłego konta na serwerze o2.pl
	//emailing /users/sendEmailToAll
	router.get('/sendEmailToAll', function(req, res, next) {

		sendEmailToAll(io);

	return res.redirect('/users/mailNotification');	
	});


 	return router;
}

