var passport = require('passport');
var User = require('mongoose').model('User');
var facebookStrategy = require('passport-facebook').Strategy;

module.exports = function(){
    //profileFields determines what fields I will get back in the profile variable, I request those fields in the aut/facebook route
    passport.use(new facebookStrategy({
        clientID : "579207438925212",
        clientSecret : "6246ccdee0eb2293a5588984f92f755d",
        callbackURL : "https://localhost:3000/auth/facebook/callback",
        profileFields : ['first_name', 'last_name', 'email']
    }, function(accessToken, refreshToken, profile, cb){
        //check if an user exists with their existing facebook id
        User.findOne({facebookID : profile.id}, function(err, user){
            //if there is an error, call cb(err), else check what is contained in user
            if (err !== null){
                cb(err);
            }else{
                //check if an user exists and if not, create one
                if (user === null){
                    var newUser = new User({facebookID : profile.id, first_name : profile._json.first_name, last_name : profile._json.last_name, email : profile._json.email});

                    newUser.save(function(err, savedUser, numAffected){
                        if (err === null){
                            cb(null, savedUser);
                        }else{
                            cb(err);
                        }
                    });
                }else{
                    cb(null, user);
                }
            }
        });
    }));
};