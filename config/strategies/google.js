var passport = require('passport');
var User = require('mongoose').model('User');
var googleStrategy = require('passport-google-oauth20').Strategy

module.exports = function(){
    passport.use(new googleStrategy({
        clientID : "12271620777-t2sn9miq2bl2an9in9jrpijk2s3vn130.apps.googleusercontent.com",
        clientSecret : "bG9eqr8YuE7kITizgxXzpK1J",
        callbackURL : "http://localhost:3000/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, cb){
        //check if an user exists with their existing google id
        User.findOne({googleID : profile.id}, function(err, user){
            //if there is an error, call cb(err), else check what is contained in user
            if (err != null){
                cb(err);
            }else{
                //check if an user exists and if not, create one
                if (user == null){
                    
                    //This gets the email from the user and if more than one exists, looks for one of type account
                    var email = null;
                    if (profile.emails.length > 0){
                        var email = profile.emails[0].value
                        profile.emails.forEach (function(value){
                            if(value.type === 'account'){
                                email = value.value;
                            }
                        });
                    }

                    var newUser = new User({googleID : profile.id, first_name : profile.name.givenName, last_name : profile.name.familyName, email : email});

                    newUser.save(function(err, savedUser, numAffected){
                        if (err == null){
                            cb(null, savedUser)
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