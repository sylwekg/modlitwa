
var User = require('../models/user');
var rolesDef=['requester','user','manager','admin'];



function loggedOut( req, res, next) {
    if (req.session && req.session.userId || req.session && req.user) {
        return res.redirect('/users/profile/'+req.session.userId);
    }
    return next();
}


function checkUser(req,reqRole,callback) {
    
    if(req.session.userId && req.session || req.session && req.user ) {
        User
        .findById(req.session.userId) 
        .exec( function(err, user) {
            if(err) {
                //req.flash('error', 'DB error');
                var err=new Error ("DB error");
                err.status = 401;
                return callback(err);
            }
            else {
                if(rolesDef.indexOf(user.role) >= rolesDef.indexOf(reqRole) ) {
                    return callback(null,true);
                }
                else {
                    var err=new Error ("access denied");
                    err.status = 401;
                    return callback(err); 
                }
            }
        });
    }
    else {
        var err=new Error ("you must be logged in to see this page");
        err.status = 401;
        return callback(err);
    }
} 

function requiresAdmin(req, res, next) {
    checkUser(req,'admin', (err,succes) => {
        if(err){
            req.flash('error', err.message);
            return res.redirect('/');
        }
        else
            return next();
    });
}

function requiresUser(req, res, next) {
    checkUser(req,'user', (err,succes) => {
        if(err){
            req.flash('error', err.message);
            return res.redirect('/');
        }
        else
            return next();
    });
}

function requiresOpiekun(req, res, next) {
    checkUser(req,'manager', (err,succes) => {
        if(err){
            req.flash('error', err.message);
            return res.redirect('/');
        }
        else
            return next();
    });
}

function requiresAplikant(req, res, next) {
    console.log('MIDDLEWARE req.params:',req.params);
    checkUser(req,'requester', (err,succes) => {
        if(err){
            req.flash('error', err.message);
            return res.redirect('/');
        }
        else 
            return next();
    });
}

//prevention for unauthorized profile crosscheck
function profileCrossCheck(req, res, next) {
    User
    .findById(req.session.userId) 
    .exec( function(err, user) {
        if(err) {
            //req.flash('error', 'DB error');
            var err=new Error ("DB error");
            err.status = 401;
            return callback(err);
        }
        else {
            if(
                (((user.role=="requester")||(user.role=="user")||(user.role=="user"))&&(req.params.id==user.id))
                ||(user.role=="admin")) {
                return next();
            }
            else {
                req.flash('error', "Access denied");
                return res.redirect('/');
            }
        }
    });

//if aplikant, user => view only his own profile

//if opiekun => view profiles of people in the group ... tdb

//if admin => view all


}

module.exports.loggedOut = loggedOut;
module.exports.requiresAdmin = requiresAdmin;
module.exports.requiresUser = requiresUser;
module.exports.requiresAplikant = requiresAplikant;
module.exports.requiresOpiekun = requiresOpiekun;
module.exports.profileCrossCheck = profileCrossCheck;
