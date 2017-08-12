
module.exports = (io)=> {
	
	
	const nodemailer = require('nodemailer');
	var User = require('../models/user');

	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

	// create reusable transporter object using the default SMTP transport
	var transporter = nodemailer.createTransport({
	    host: 'poczta.o2.pl',
	    port: 465,
	    pool: true,
	    maxMessages :10,
	    maxConnections:1,
	    rateDelta : 4000,
	    rateLimit : 1,	
	    secure: true, // secure:true for port 465, secure:false for port 587
	    auth: {
	        user: process.env.MAILING_USER,
	        pass: process.env.MAILING_USER_PASSWORD
	    }
	});


	function wyslijEmail(user,usersCount,userNo) {
		return new Promise((resolve, reject) => { 
			// setup email data with unicode symbols
			var mailOptions = {
			    from: '" Kółko różańcowe "  <messaging.system@o2.pl>', // sender address
			    to: user.email, // list of receivers
			    subject: 'Zmiana tajemnic', // Subject line
			    //text: 'Hello world ?', // plain text body
			    html: ` Witaj ${user.name},<br><br> 
			    		Twoja nowa tajemnica to <b> ${user.tajemnica.name}.</b><br><br>
			    		Pozdrawiam.`, // html body
			};
			// send mail with defined transport object
			
			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) {
			        return reject(error);
			    }
			    console.log('Message %s sent: %s', info.messageId, info.response);
			    io.emit('msgSent',"wysłano "+userNo+" / "+usersCount);
			    return resolve(info);
			});
		});
	}

	function wyslijAllEmails(users) {
		var count=0;
		var promises = users.map(user => {
			count++;
			//io.emit('msgSent',"wysyłanie w trakcie..."+count+" / "+users.length);
			return wyslijEmail(user,users.length,count);
		});
		return Promise.all(promises);
	}


	return User
	.find()
	.populate('tajemnica')
	.then(wyslijAllEmails)
	.then(results => {
		var success=0;
		results.forEach(function(result) {
			if(result.response.startsWith("250")) 
				success++;
		});
		console.log("results: ",results);
		io.emit('msgSent',"wysłano "+success+" / "+results.length+" maili");
		//req.flash('error', ' e-maile z powiadomieniem wyslane!');
		//return res.redirect('/');
	})
	.catch(err => {
		//req.flash('error', err.message);
		console.log("error: ",err.message);
		io.emit('msgErr',err.message);
		//return res.redirect('/');
		//return next(err);
	});
	
}


