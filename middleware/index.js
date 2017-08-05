
function loggedOut( req, res, next) {
    if (req.session && req.session.userId || req.session && req.user) {
        return res.redirect('/users/profile/'+req.session.userId);
    }
    return next();
}

function requiresLogin(req, res, next) {
    if(req.session.userId && req.session || req.session && req.user )
        return next();
    else {
        req.flash('error', 'you must be logged in to see this page');
        var err=new Error ("you must be logged in to see this page");
        err.status = 401;
        return res.redirect('/');
        //return next(err);
    }
}


module.exports.loggedOut = loggedOut;
module.exports.requiresLogin = requiresLogin;