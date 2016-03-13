var passport = require('passport');
var User = require('mongoose').model('User');

module.exports = function(){

    passport.serializeUser(function(user, done){
	   //console.log('serialize ran');
	   done(null, user.id);
    });

    //I can add -password to not fetch the password field, do later
    passport.deserializeUser(function(id, done){
	User.findOne({_id: id}, function(err, user){
	    //console.log('de err: ' + err);
	    //console.log('de user: ' + user);
	    done(err, user);
	});
    });

    require('./strategies/local.js')();
};
