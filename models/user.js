var mongoose = require("mongoose");
var Tajemnica = require('./tajemnica'); 
var Group = require('./group');

var Schema = mongoose.Schema;

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required : true,
        trim : true
    },
    name: {
        type: String,
        required : true,
        trim : true
    },
    tel: {
        type: String,
        required : true
    },
    tajemnica: { 
        type: Schema.Types.ObjectId, 
        ref: 'Tajemnica' 
    },
    grupa: { 
        type: Schema.Types.ObjectId, 
        ref: 'Group' 
    },
    joinDate: {
        type: Date,
        required : true        
    },
    updateDate: {
        type: Date,
        default: Date.now,       
        required : true        
    },   
    foto: {
        type: String
    },  
    // password: {
    //     type: String,
    //     required : true
    // },
    // facebookId: {
    //     type: String
    // }   
});

userSchema.statics.zmianaTajemnic= function( callback) {
    
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
        console.log("od aktualizacji minelo :",(Date.now() - user.updateDate)/(1000*60)," min");
        if( (Date.now() - user.updateDate) <  1000*60  ) { //mniej niz 1 min
            var err = new Error(`User ${user.email} byl juz aktualizowany.`);
            throw err;
        } else {
            return Tajemnica.findById(user.tajemnica)
            .then(nastepnaTajemnica)
            .then(nextTaj => {
                user.tajemnica = nextTaj._id;
                user.updateDate = Date.now();
                return user;
            });
        }
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
        .then( user => { // obsługa błędu
            console.log("user :",user);
            if(user instanceof User)  {
                user.save(function (err) {
                    console.log('saved');
                    if (err) {
                        console.log(err);
                        return err;
                    }
                    return user;  
                }); 
            }
        // })
        // .catch(err => {
        //  req.flash('error', err);
        });
    }

    function updateAllRecords(users) {
        var promises = [];
        for (i=0;i<users.length;i++) {
            userId=users[i]._id;
            promises.push( updateUserRecords(userId));
        }
        return Promise.all(promises);
    }


    User
    .find()
    .then(updateAllRecords)
    .then(results => {
        console.log("results: ",results);
        //req.flash('error', ' Zmiana tajemnic wykonana!');
        return callback(null, results);
        //return res.redirect('/');
    })
    .catch(err => {
        //req.flash('error', err.message);
        return callback(err.message);
        //return res.redirect('/');
        
    });
};


var User = mongoose.model('User', userSchema);
module.exports = User;