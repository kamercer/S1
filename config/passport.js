var passport = require('passport');
var User = require('mongoose').model('User');

module.exports = function(){

    passport.serializeUser(function(user, done){
	   done(null, user.id);
    });

    //I can add -password to not fetch the password field, do later
    passport.deserializeUser(function(id, done){
        User.findOne({_id: id}).populate('memberOf').exec(function(err, user){
            //console.log('de err: ' + err);
            //console.log('de user: ' + user);
            done(err, user);
        });
    });

    require('./strategies/local.js')();
    require('./strategies/facebook.js')();
    require('./strategies/google.js')();
};
