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


//var jobs = [];

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
	

const nodemailer = require('nodemailer');

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

  			
			//scheduler set to single date in future
			if(req.body.powtarzaj==0) {
				console.log('scheduler single date');

				//kasowanie wszystkich poprzednich zaschedulowanych eventow
				if(schedule.scheduledJobs) {
					for (x in schedule.scheduledJobs) {
						//schedule.scheduledJobs[x].job();
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
  			return res.redirect('/');
  		}
  	});


	// function nastepnaTajemnica(tajemnica) {
	// 	//console.log("nastepnaTajemnica");
	// 	var nowaTajemnica;
	// 	if (tajemnica.number<20)
	// 		nowaTajemnica=tajemnica.number+1;
	// 	else
	// 		nowaTajemnica=1;

	// 	return Tajemnica.findOne({'number' : nowaTajemnica}).exec();  
	// }
	
	// function updateRecord(user) {
	// 	console.log("od aktualizacji minelo :",(Date.now() - user.updateDate)/(1000*60*60)," godzin");
	// 	if( (Date.now() - user.updateDate) <  1000*60*60  ) { //mniej niz 1 godzina
	// 		var err = new Error(`User ${user.email} byl juz aktualizowany.`);
	// 		throw err;
	// 	} else {
	// 		return Tajemnica.findById(user.tajemnica)
	// 		.then(nastepnaTajemnica)
	// 		.then(nextTaj => {
	// 			user.tajemnica = nextTaj._id;
	// 			user.updateDate = Date.now();
	// 			return user;
	// 		});
	// 	}
			

	// }

	// function getUserRecord(userId) {
	// 	console.log("getUserRecord");
	// 	return User
	// 	.findById(userId)
	// 	.exec(function (err,user) {
	// 			if (err) 
	// 				return err;
	// 			else 
	// 				return user; 	
	// 		});
	// }

	// function updateUserRecords(userId) {
	// 	return getUserRecord(userId)
	// 	.then(updateRecord)
	// 	.then( user => { // obsługa błędu
	// 		console.log("user :",user);
	// 		if(user instanceof User)  {
	// 			user.save(function (err) {
	// 				console.log('saved');
	// 				if (err) {
	// 					console.log(err);
	// 					return err;
	// 				}
	// 				return user;  
	// 			});	
	// 		}
	// 	// })
	// 	// .catch(err => {
	// 	// 	req.flash('error', err);
	// 	});
	// }

	// function updateAllRecords(users) {
	// 	var promises = [];
	// 	for (i=0;i<users.length;i++) {
	// 		userId=users[i]._id;
	// 		promises.push( updateUserRecords(userId));
	// 	}
	// 	return Promise.all(promises);
	// }


	// User
	// .find()
	// .then(updateAllRecords)
	// .then(results => {
	// 	console.log("results: ",results);
	// 	req.flash('error', ' Zmiana tajemnic wykonana!');
	// 	return res.redirect('/');
	// })
	// .catch(err => {
	// 	req.flash('error', err.message);
	// 	return res.redirect('/');
	// 	//return next(err);
	// });


});

//emailing /users/sendEmailToAll
router.get('/sendEmailToAll', function(req, res, next) {

	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
	    host: 'poczta.o2.pl',
	    port: 465,
	    pool: true,
	    secure: true, // secure:true for port 465, secure:false for port 587
	    auth: {
	        user: 'messaging.system@o2.pl',
	        pass: 'sender123'
	    }
	});


	function wyslijEmail(user) {
		return new Promise((resolve, reject) => { 
			// setup email data with unicode symbols
			let mailOptions = {
			    from: '" Kółko różańcowe "  <messaging.system@o2.pl>', // sender address
			    to: user.email, // list of receivers
			    subject: 'Zmiana tajemnic', // Subject line
			    //text: 'Hello world ?', // plain text body
			    html: ` Witaj ${user.name},<br><br> 
			    		Twoja nowa tajemnica to <b> ${user.tajemnica.name}.</b><br><br>
			    		Pozdrawiam.` // html body
			};
			// send mail with defined transport object
			
			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) {
			        return reject(error);
			    }
			    console.log('Message %s sent: %s', info.messageId, info.response);

			    return resolve(info);
			});
		});
	}

	function wyslijAllEmails(users) {
		let promises = users.map(user => {
			return wyslijEmail(user);
		});
		return Promise.all(promises);
	}


	User
	.find()
	.populate('tajemnica')
	.then(wyslijAllEmails)
	.then(results => {
		console.log("results: ",results);
		req.flash('error', ' e-maile z powiadomieniem wyslane!');
		return res.redirect('/');
	})
	.catch(err => {
		req.flash('error', err.message);
		return res.redirect('/');
		//return next(err);
	});
});






module.exports = router;
