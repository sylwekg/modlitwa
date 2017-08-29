
process.env.NODE_ENV = 'test';

let chai = require('chai');
let User = require('../models/user');

let chaiHttp = require('chai-http');
let should = chai.should();
let expect = chai.expect;
let app = require('../app');

chai.use(chaiHttp);


describe('User API Testing ...', function() {
    it('Should GET list of all users ', function(done) {
		chai.request(app)
            .get('/users')
            .end((err, res) => {
            	expect(err).to.be.null;
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
                done();
            });
    });

    it('Login test ', function(done) {
		chai.request(app)
            .post('/admin/users/login')
            .send({ email: 'sylwester.guzek@wp.pl', password: 'user' })
            .end((err, res) => {
            	expect(err).to.be.null;
            	//expect(res).to.have.cookie('session');
                res.should.have.status(200);

                
  				//expect([1, 2]).to.be.an('array');
                done();
            });
    });

});



	  // var newUser = new User({
	  // 	email: "mocha@example.com",
	  // 	name: "mocha",
	  //   tel: "1234567890",
	  //   // tajemnica: tajemnica._id,
	  //   // grupa: grupa,
	  //   foto: "avatar.jpg",	
	  //   password: "user",
	  //   joinDate: new Date().getTime()
	  // });

   //    newUser.save(function(err) {
   //      if (err) done(err);
   //      else done();
   //    });