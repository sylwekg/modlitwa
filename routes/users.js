module.exports = function(io) {

	var express = require('express');
	var router = express.Router();
	var path = require('path');
	var multer  = require('multer');
	var fs = require('fs');
	var schedule = require('node-schedule');
	var passport = require('passport');

	var User = require('../models/user');
	var Tajemnica = require('../models/tajemnica');
	var Group = require('../models/group');
	var Global = require('../models/global');

	var sendEmailToAll = require('../src/sendEmailToAll');
	var utils = require('../src/utils');

	var mid = require('../middleware/login');

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
	router.get('/', mid.requiresAdmin, function(req, res, next) {
	  var messages = req.flash('error');
	  User
	  	.find()
	  	.populate('tajemnica')
	  	.populate('grupa')
	  	.exec( function(err, docs) {
	  		if(err)
	  			return next(err);
	  		else  		
	    		return res.render('users', { backButton:true, backLink:"/admin", data: docs, messages:messages, hasErrors: messages.length>0 });  
	  });
	});

//===================USERS AUTHENTICATION ==================================================

	router.get('/login',mid.loggedOut, function (req, res, next) {
	    var messages = req.flash('error');
	    return res.render('login', { messages:messages, hasErrors: messages.length>0});
	});


	router.post('/login',function(req, res, next){
	    if (req.body.email && req.body.password) {
	        User.authenticate(req.body.email, req.body.password, function (error, user) {
	            if(error || !user) {
	                var err = new Error('Wrong email or password - test');
	                err.status = 401;
	                req.flash('error', 'Wrong email or password');
	                return res.redirect('/admin/users/login');
	                
	            } else {
	                req.session.userId = user._id;
	                req.session.userName = user.name;
	           //========= odnosnik do profilu obecnie zalogowanego uzytkownika://users/profile/'+req.session.userId);
	                return res.redirect('/admin');   
	            }
	        });
	    } else {
	        var err = new Error('Email and password are required');
	        err.status = 401;
	        return next(err);
	    }
	});


	router.get('/logout',function (req, res, next) {
	    if(req.session) {
	        req.session.destroy(function (err) {
	            if(err)
	                return next(err);
	            else
	                return res.redirect('/admin/');
	        });
	    }
	});

	//users/register
	router.get('/register', mid.loggedOut, function(req, res, next){
	    var messages = req.flash('error');
	    return res.render('registerProfile', { messages:messages, hasErrors: messages.length>0});
	});


	router.post('/register', upload.any(), function(req, res, next){
	  	console.log('req.body::>>',req.body);
		console.log('req.files::>>',req.files);	

		if(req.body.foto){
			var imageBuffer = utils.decodeBase64Image(req.body.foto);
			//console.log(imageBuffer);
			fs.writeFile(req.files[0].path, imageBuffer.data, function(err) { 
				if(err)
					return(err);
				console.log('doc saved succesfuly');
				//var err = new Error('All fields required.'); 
			});
		}

	  	if(req.body.email && req.body.name && req.body.password ) {	
			var foto, grupa;
			if(req.files[0]) {
				var ext = path.extname(req.files[0].originalname)
				if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'&& ext !== '.JPEG' && ext !== '.JPG' && ext !== '.GIF' && ext !== '.PNG' ) {
					req.flash('error', 'Zły format zdjecia, zdjecie nie zostało zmienione.');
				} else {
					foto=req.files[0].filename;
				}
			}
			else
				foto="avatar.jpg";

  			var newUser = new User({
			  	email: req.body.email,
			  	name: req.body.name,
			  	password: req.body.password,
			    tel: req.body.tel,
			    foto: foto,
			    joinDate: new Date().getTime()
		  		});

			newUser.save(function (err, newUser) {
  				if(err) {
	                if(err.message.startsWith("E11000"))
	                    req.flash('error', 'Podany e-mail juz istnieje. ');
	                else
	                    req.flash('error', 'Błąd bazy danych. Spróbuj ponownie ');
	                return res.redirect('/admin/users/register');
  				}
  				else {
  					res.status(201);
  					req.session.userId = newUser._id;
  					req.session.userName = newUser.name;	
					return res.redirect('/admin/users/profile/'+req.session.userId);
  				}
  			});
		}
		else {
			var err = new Error('All fields required.');
	        err.status = 400;
	        req.flash('error', 'All fields required');
	        return res.redirect('/admin/users/register');
		}
	});

	//users/priv - setting users privileges
	router.get('/priv', mid.requiresAdmin, function(req, res, next) {
		var messages = req.flash('error');
		User
		.find()
		.exec( function(err, docs) {
			if(err)
		  		return next(err);
		  	else  		
		    	return res.render('priv', { backButton:true, backLink:"/admin", data: docs, messages:messages, hasErrors: messages.length>0 });  
		});
	});

	router.post('/priv', mid.requiresAdmin, function(req, res, next) {
		modList=req.body;	
		var pa=Object.keys(modList).map((e) => {
			//console.log(`...updating user=${e} new role=${modList[e]}`);
			return new Promise((resolve, reject) => {
				User
				.update(
					{_id: e}, {role:modList[e]}, function (err, raw) {
					if (err) 	
						reject (err);
					resolve (raw);
				});
			});
		});
		
		Promise.all(pa).then(values => {
			console.log("cumulative",values);
			var i=0;
			values.forEach((item, index)=> {
				if(item.ok==1) i++;
			});
			req.flash('error', "Modified "+i+ " users");
			//console.log('===============> ',i)
		}).catch(reason => { 
  			console.log(reason);
  			req.flash('error', reason);
		});
		return res.redirect('/admin/users/priv');
	});


	// router.get('/login/facebook',passport.authenticate('facebook',{scope:'public_profile'}));

	// router.get('/login/facebook/callback', passport.authenticate('facebook', {
	//     successRedirect: '/profile',
	//     failureRedirect: '/login',
	//     failureFlash: true
	// }));



//=================USERS MANAGEMENT=====================================================

	/*  user profile /users/profile/:id */
	router.get('/profile/:id', mid.requiresAplikant, mid.profileCrossCheck, function(req, res, next) {
		var messages = req.flash('error');	

		User
	  	.findById(req.params.id) 
	  	.populate('tajemnica')
	  	.populate('grupa')
	  	.exec( function(err, docs) {
	  		if(err)
	  			return next(err);
	  		else
	    		return res.render('showProfile', { backButton:true, backLink:"/admin/users" ,data: docs , messages:messages, hasErrors: messages.length>0});  
		});
	});


	/* Add user    /users/add    */
	router.post('/add', mid.requiresAdmin, upload.any(), function(req, res, next) {
	  	console.log(req.body);

		if(req.body.foto){
			var imageBuffer = utils.decodeBase64Image(req.body.foto);
			//console.log(imageBuffer);
			fs.writeFile(req.files[0].path, imageBuffer.data, function(err) { 
				if(err)
					return(err);
				console.log('foto saved succesfuly');
				//var err = new Error('All fields required.'); 
			});
		}	  	


	  	if(req.body.email && req.body.name) {	
		  	Tajemnica
		  	.findOne({'number': req.body.tajemnica })
		  	.exec( function(err, tajemnica) {
		  		if(err)
		  			return next(err);
		  		else {
	  				var foto, grupa;
					if(req.files[0]) {
						var ext = path.extname(req.files[0].originalname)
						if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'&& ext !== '.JPEG' && ext !== '.JPG' && ext !== '.GIF' && ext !== '.PNG' ) {
							req.flash('error', 'Zły format zdjecia, zdjecie nie zostało zmienione.');
						} else {
							foto=req.files[0].filename;
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
					    password: "user",
					    joinDate: new Date().getTime()
				  		});

		  			newUser.save(function (err, newUser) {
		  				if(err) {
			                if(err.message.startsWith("E11000"))
			                    req.flash('error', 'Podany e-mail juz istnieje. ');
			                else {
			                    req.flash('error', 'Błąd bazy danych. Spróbuj ponownie ');
			                    console.log(err);
			                }

			                return res.redirect('/admin/users/add');
		  				}
		  				res.status(201);
						return res.redirect('/admin/users/profile/'+newUser._id);
		  			});
		  		}	
		 	});
		}
		else {
			var err = new Error('All fields required.');
	        err.status = 400;
	        req.flash('error', 'All fields required');
	        return res.redirect('/admin/users/add');
		}
	});

	router.get('/add', mid.requiresAdmin, function(req, res, next) {
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
			  			return res.render('addProfile', { backButton:true, backLink:"/admin/users" ,'tajemnice': tajemnice, 'grupy': grupy, 
			  				messages:messages, hasErrors: messages.length>0 });  
			  		}
			  	});
	  		}	
	 	});
	});


	/* delete /users/delete/:id  */
	router.get('/delete/:id', mid.requiresAdmin, function(req, res, next) {
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
						return res.redirect('/admin/');	
					}
				});
	  		}
	  	});
	});


	/* Edit user   /users/edit/:id     */
	router.get('/edit/:id', mid.requiresAdmin, function(req, res, next) {
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
					  			return res.render('editProfile', { backButton:true, backLink:"/admin/users/profile/"+req.params.id , data: docs, 'tajemnice': tajemnice, 'grupy': grupy});  
					  		}
					  	});
			  		}	
			 	});
	  		}
	    });
	});

	router.post('/edit/:id', mid.requiresAdmin, upload.any(), function(req, res, next) {
		console.log(req.body);
		console.log(req.file);

		if(req.body.foto){
			var imageBuffer = utils.decodeBase64Image(req.body.foto);
			//console.log(imageBuffer);
			fs.writeFile(req.files[0].path, imageBuffer.data, function(err) { 
				if(err)
					return(err);
				console.log('doc saved succesfuly');
				//var err = new Error('All fields required.'); 
			});
		}

		var updatedUser = {
				name : req.body.name, 
	  			email : req.body.email, 
	  			tel : req.body.tel,
				tajemnica : req.body.tajemnica, 
				updateDate: new Date().getTime(),
				grupa: (req.body.grupa==="0") ?  null : req.body.grupa};

		if(req.files[0]) {
			var ext = path.extname(req.files[0].originalname)
			if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'&& ext !== '.JPEG' && ext !== '.JPG' && ext !== '.GIF' && ext !== '.PNG' ) {
				req.flash('error', 'Zły format zdjecia, zdjecie nie zostało zmienione.');
			} else {
				updatedUser.foto=req.files[0].filename;
			}
		}

		User
	  	.update({ _id  : req.params.id }, updatedUser, function (err, raw) {
			if (err) 
				return next(err);
			console.log('The raw response from Mongo was ', raw);
			return res.redirect('/admin/users/profile/'+req.params.id);
		}); 
	});

//=================== FUNCJE ZARZADZANIA TAJEMNICAMI============================================

	/* request o zmiane tejemnic /users/zmianaTajemnic  */
	router.get('/zmianaTajemnic', mid.requiresAdmin ,function(req, res, next) {
		var messages = req.flash('error');
		//console.log(schedule.scheduledJobs);
		
		Global
	  	.findOne({name:'default'})
	  	.exec( function(err, doc) {
	  		if(err) {
	  			console.log('brak ustawien standardowych');
	  			return next(err);
	  		}
	  		else {
	  			console.log(doc);
	  			//recover scheduled jobs from database if not present in scheduler
	  			if(doc) {
	  				if(Object.keys(schedule.scheduledJobs).length === 0 ) {
	  					// konwersja czasu z lokalnego do UTC przed zapisaniem do bazy
			  			var date = new Date(doc.dataZmiany);
			  			//var loc_d = date.getTimezoneOffset()*60000;
			  			console.log('ladowanie eventu z bazy');
						schedule.scheduleJob(Date.parse(date), function(){
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
	  			}
	  			return res.render('zmianaTajemnic', { backButton:true, backLink:"/admin", data: doc, messages:messages, hasErrors: messages.length>0 });
	  		} 			  
		}); 
	});

	//aktualizacja daty zaplanowanej dla zmiany tajemnic
	router.post('/zmianaTajemnic/update',mid.requiresAdmin, function(req, res, next) {
		console.log("formularz przysłał >>>>",req.body);

		Global
	  	.findOne({name:'default'})
	  	.exec( function(err, docs) {
	  		if(err)
	  			return next(err);
	  		else {
	  			
	  			if(docs) 
	  				docs.remove();
	  			// konwersja czasu z lokalnego do UTC przed zapisaniem do bazy

	  			// var d = new Date(req.body.date);
	  			// console.log("xxxxxxxxxxxxxxxxxxx",d.toUTCString());
	  			// console.log("xxxxxxxxxxxxxxxxxxx offset:",d.getTimezoneOffset()/60);
	  			var loc_d = req.body.offset*60000;

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
						return res.redirect('/admin/users/zmianaTajemnic');
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
	router.get('/zmianaTajemnic/now', mid.requiresAdmin, function(req, res, next) {

		User.zmianaTajemnic(function(error, result) {
	  		if(error) {
	  			console.log('Błąd w trakcie zmiany tajemnic !')
	  			req.flash('error', ' Błąd w trakcie zmiany tajemnic !');
	  			return res.redirect('/admin/');
	  		}
	  		else {
	  			console.log('Zmiana tajemnic wykonana')
	  			req.flash('error', ' Zmiana tajemnic wykonana');
	  			sendEmailToAll(io);
	  			return res.redirect('/admin/');
	  		}
	  	});
	});

	//emailing /users/mailNotificaton
	router.get('/mailNotification', mid.requiresAdmin ,function(req, res, next) {
		var messages = req.flash('error');
		//load data
		//.........

		return res.render('mailNotification', 
			{ backButton:true, backLink:"/admin", messages:messages, hasErrors: messages.length>0 });

	});


	//OPCJA #1 wysylanie ze zwykłego konta na serwerze o2.pl
	//emailing /users/sendEmailToAll
	router.post('/sendEmailToAll', mid.requiresAdmin, function(req, res, next) {

		sendEmailToAll(io);

	return res.redirect('/admin/users/mailNotification');	
	});

//======================= WYSYLANIE POWIADOMIEN WEWNATRZ APLIKACJI DO POJEDYNCZYCH OSOB ===================

	router.get('/msgNotification', mid.requiresOpiekun ,function(req, res, next) {
		var messages = req.flash('error');
		User
		  	.find()
		  	.populate('grupa')
		  	.exec( function(err, users) {
		  		if(err)
		  			return next(err);
		  		else  {
				  	Group
				  	.find()
				  	.populate('opiekun')
				  	.exec( function(err, groups) {
				  		if(err)
				  			return next(err);
				  		else
				    		return res.render('msgNotification', 
				    			{ 	backButton: true, 
				    				backLink: "/admin", 
				    				users: users, 
				    				groups: groups,
				    				messages:messages, 
				    				hasErrors: messages.length>0
				    			}); 
				  	});
		  		}		
		});
	});

	// admin/users/messages
	router.post('/messages', mid.requiresOpiekun, function(req, res, next) {
		console.log(req.body);

		if(req.body.content.length < 6) {
			err = new Error("wiadomość za krótka (min. 6 znaków)");
			//err.message="wiadomość za krótka (min. 6 znaków)";
			console.log(err);
			return res.status(400).send({ message:err.message});
		}

		var message = {
				from: req.body.from,
		        date: new Date().getTime(),
		        content: req.body.content,
		        read: false,
			};

		if(req.body.kto==="User") {
			User
		  	.update({ _id  : req.body.user }, { $push: { messages: message} }, function (err, raw) {
				if (err) {
					return res.status(400).send({ message:err.message});
				} else {
					console.log('The raw response from Mongo was ', raw);
					return res.status(201).send({ message:raw });
				}
			}); 
		}
		if(req.body.kto==="Grupa") {
			User
		  	.update({ grupa  : req.body.grupa }, { $push: { messages: message} }, { multi: true }, function (err, raw) {
				if (err) {
					return res.status(400).send({ message:err.message});
				} else {
					console.log('The raw response from Mongo was ', raw);
					return res.status(201).send({ message:raw });
				}
			}); 
		}
		if(req.body.kto==="Wszyscy") {
			User
		  	.update({ }, { $push: { messages: message} }, { multi: true }, function (err, raw) {
				if (err) {
					return res.status(400).send({ message:err.message});
				} else {
					console.log('The raw response from Mongo was ', raw);
					return res.status(201).send({ message:raw });
				}
			}); 
		}


	});

//=================================================================================================
 	
 	return router;
}

