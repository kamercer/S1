"use strict"
var passport = require('passport');
var model = require('./models/model.js');
var multer = require('multer');
var upload = multer({dest: './uploads/'});

module.exports = function(app){
    
    app.get('/', function(req, res){
        //if(req.user){
          //  res.redirect('/home');
            //return;
        //}
        res.sendFile('/views/tempIndex.html', {root: __dirname + '/../public'});
    });
    
    app.post('/', function(req, res){
        console.log('hit post /');
        res.end();
    });

    //This is called when the user clicks on the facebook login button.  It redirects them to the facebook popup and they log in.
    //They are then redirected back to the callback route specified in facebook.js
    app.get('/auth/facebook', passport.authenticate('facebook', {scope : ['public_profile', 'email']}));

    //This is the facebook callback function specified in facebook.js.  Once the user logs in through facebook, they are redirected back to this route.
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect : '/'}),
    function(req, res){
        res.redirect('/home/');
    });

    app.get('/auth/google', passport.authenticate('google', {scope : ['profile', 'email']}));

    app.get('/auth/google/callback', 
    passport.authenticate('google', {failureRedirect : '/'}),
    function(req, res){
        res.redirect('/home/');
    });

    //used to login through local authentication
    app.post('/login', passport.authenticate('local'),function(req, res){
       res.redirect('/home/');
    });

    app.post('/createAccount', function(req, res){
         model.createAccount(req, res);
    });
    
    app.post('/createOrganization', loginCheck, function(req, res){
       model.createOrganization(req, res);
    });
    
    //homepage of users
    app.get('/home/', loginCheck, function(req, res){
       model.createHomePage(req, res);
    });

    //done to handle lack of trailing slash - not sure if this is a good way to do this
    app.get('/home', loginCheck, function(req, res){
        res.redirect('/home/');
    });
    
    app.post('/home/changeProfilePic', upload.any(), loginCheck, function(req, res){
        model.changeProfilePic(req, res);
    });

    app.post('/home/setLocation', loginCheck, function(req, res){
        model.setLocation(req, res);
    });

    //This is intended to be the one route for profile pics.  will replace /home/userImage
    app.get('/userImage/:id', loginCheck, function(req, res){
        model.getProfilePic(req, res);
    });

    //This returns information about a particular user, used for a modal
    app.get('/organization/:id/userInfo/:userId', loginCheck, function(req, res){
        model.getUserInfo(req, res)
    });

    app.post('/organization/:id/changeUserStatus', loginCheck, function(req, res){
        model.changeUserStatus(req, res);
    });

    app.get('/eventInfo/:id', function(req, res){
        model.getEventInfo(req, res);
    });

    app.get('/eventViewInfo/:id', function(req, res){
        model.getEventViewInfo(req, res);
    });

    app.get('/organization/:id/orgSettingsInfo', loginCheck, function(req, res){
        model.getOrgSettingsInfo(req, res);
    });
    
    app.get('/organization/:id/', function(req, res){
        model.loadOrganizationPage(req, res);
    });

    //done to handle lack of trailing slash - not sure if this is a good way to do this
    app.get('/organization/:id', function(req, res){
        res.redirect('/organization/' + req.params.id + '/');
    });

    app.get('/organization/:id/organizationImage', function(req, res){
        model.getOrganizationImage(req, res);
    });

    //This gets information about a member that only other members can see
    //incomplete
    app.get('/organization/:id/userInfo', loginCheck, function(req, res){
        model.getUserInfo(req, res);
    });
    
    //check to make sure that user has permission to join
    app.post('/organization/:id/join', loginCheck, function(req, res){
        model.joinUser(req, res);
    });
    
    //check to make sure that user has permission to create event
    //add date and time picker
    app.post('/organization/:id/createEvent', upload.any(), loginCheck, function(req, res){
       model.createEvent(req, res); 
    });
    
    app.post('/RSVP/:id', loginCheck, function(req, res){
        model.RSVP(req, res);
    });

    app.post('/organization/:id/changeOrganizationImage', upload.any(), loginCheck, function(req, res){
        model.changeOrganizationImage(req, res);
    });

    app.post('/changeEventImage/:id', upload.any(), loginCheck, function(req, res){
        model.changeEventImage(req, res);
    });

    app.post('/eventEdit/:id', loginCheck, function(req, res){
        model.eventEdit(req, res);
    });

    app.post('/eventDetailEdit', loginCheck, function(req, res){
        model.eventDetailEdit(req, res);
    });

    app.get('/eventImage/:id', function(req, res){
        model.getEventImage(req, res);
    });
    
    app.get('/organization/:id/editEvent/:eventId', loginCheck, function(req, res){
        model.createEventEditPage(req, res);
    });
    
    app.post('/organization/:id/editEvent/:eventId/submitUnregisteredUser', loginCheck, function(req, res){
        model.submitUnregisteredUser(req, res);
    });
    
    app.post('/organization/:id/editEvent/:eventId/updateUser', loginCheck, function(req,res){
        model.updateUser(req, res);
    });

    app.post('/organization/:id/changeOrganizationName', loginCheck, function(req, res){
        model.changeOrganizationName(req, res);
    });

    app.post('/organization/:id/changeOrganizationNickname', loginCheck, function(req, res){
        model.changeOrganizationNickname(req, res);
    });

    app.post('/organization/:id/changeIndividualGoalHours', loginCheck, function(req, res){
        model.changeIndividualGoalHours(req, res);
    });

    app.post('/organization/:id/changeOrganizationGoalHours', loginCheck, function(req, res){
        model.changeOrganizationGoalHours(req, res);
    });

    app.post('/organization/:id/changeJoinOption/:value', loginCheck, function(req, res){
        model.changeJoinOption(req, res);
    });

    app.get('/organization/:id/getApplications', loginCheck, function(req, res){
        model.getApplications(req, res);
    });

    //This is used when an admin allows a member into an organization
    app.post('/organization/:id/allowMember/:value', loginCheck, function(req, res){
        model.allowMember(req, res);
    });
    
    //used for log page  not used
    //app.get('/log', loginCheck, function(req, res){
      //  model.getUserOrganizations(req, res);
    //});
    

    /*
    app.post('/log', loginCheck, function(req, res){
        model.logEventHours(req, res);
    });
    
    //used for log page   not used
    app.post('/loadEvents', loginCheck, function(req, res){
        model.getUserEvents(req, res);
    });
    
    app.get('/signIn/', loginCheck, function(req, res){
        res.sendFile('/views/signIn.html', {root: __dirname + '/../public'});
    });

    app.get('/signIn', loginCheck, function(req, res){
        res.redirect('/signIn/');
    });
    */
    
    function loginCheck(req, res, next){
        if (req.user){
		  next();
		}else{
		  res.redirect('/');
		}
	}
}