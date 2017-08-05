var mongoose = require("mongoose");
var Tajemnica = require('./tajemnica'); 
var Group = require('./group');
var bcrypt = require("bcrypt");


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
    password: {
        type: String,
        required : true
    },
    facebookId: {
        type: String
    }   
});


//authentication
userSchema.statics.authenticate = function (email, password, callback) {
    User.findOne({ email: email})
        .exec(function (error, user) {
            if(error)
                return callback(error);
            else if(!user) {
                var err = new Error('Uzytkownik nie znaleziony');
                err.status = 401;
                return callback(err);
            }
            bcrypt.compare(password, user.password, function (error, result) {
                if(result)
                    return callback(null, user);
                else {
                    return callback(error);
                }
            });
        });
};

//pre save function to hash the pass
userSchema.pre('save',function (next){
    var user = this;
    bcrypt.hash(user.password, 10, function (err, hash) {
        if(err)
            return next(err);
        else{
            user.password = hash;
            next();
        }
    });
});


//funkcja zmiany tajemnic
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
                User
                .update(
                    { _id  : user._id }, 
                    { tajemnica : user.tajemnica,
                    updateDate : user.updateDate },
                    function (err, raw) {
                        if (err) 
                            return err;
                        console.log('The raw response from Mongo was ', raw);
                        return raw;
                });
            }
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
    })
    .catch(err => {
        //req.flash('error', err.message);
        return callback(err.message);
    });
};


var User = mongoose.model('User', userSchema);
module.exports = User;