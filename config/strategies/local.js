var passport = require('passport');
var User = require('mongoose').model('User');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(){
    passport.use(new LocalStrategy(function(username, password, done){
	//console.log('local strategy running');
	User.findOne(
	    {username: username},
	    function(err, user){
		if (err){
		    console.log('err');
		    return done(err);
		}

		if (!user){
		    console.log('unknown user');
		    return done(null, false, {message: 'Unknown user'});
		}

		if (!user.authenticate(password)){
		    console.log('invalid password');
		    return done(null, false, {message: 'Invalid password'});
		}
		
		//console.log('local strategy successful');
		return done(null, user);
	    }
	);
    }));
};
