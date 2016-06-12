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
        res.sendFile('/views/index.html', {root: __dirname + '/../public'});
    });
    
    app.post('/', function(req, res){
        console.log('hit post /');
        res.end();
    });
    
    //used to login
    app.post('/login', passport.authenticate('local'),function(req, res){
       res.redirect('/home/');
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
    
    app.get('/home/userImage', loginCheck, function(req, res){
        model.getProfilePic(req, res);
    });
    
    app.post('/createAccount', function(req, res){
         model.createAccount(req, res);
    });
    
    app.post('/createOrganization', loginCheck, function(req, res){
       model.createOrganization(req, res);
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
    
    //check to make sure that user has permission to join
    app.post('/organization/:id/join', loginCheck, function(req, res){
        model.joinUser(req, res);
    });
    
    //check to make sure that user has permission to create event
    //add date and time picker
    app.post('/organization/:id/createEvent', upload.any(), loginCheck, function(req, res){
       //console.log('create event: ' + req.body.name);
       model.createEvent(req, res); 
    });
    
    app.post('/organization/:id/submitRSVP', loginCheck, function(req, res){
        model.submitRSVP(req, res);
    });

    app.post('/organization/:id/changeOrganizationImage', upload.any(), loginCheck, function(req, res){
        model.changeOrganizationImage(req, res);
    });

    app.get('/events/eventImage/:id', function(req, res){
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
    
    //used for log page  not used
    //app.get('/log', loginCheck, function(req, res){
      //  model.getUserOrganizations(req, res);
    //});
    
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
    
    function loginCheck(req, res, next){
        if (req.user){
		  next();
		}else{
		  res.redirect('/');
		}
	}
    
}