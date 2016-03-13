var passport = require('passport');
var model = require('./models/model.js');

module.exports = function(app){
    
    app.get('/', function(req, res){
        res.sendFile('/views/index.html', {root: __dirname + '/../public'});
    });
    
    //used to login
    app.post('/login', passport.authenticate('local'),function(req, res){
       res.redirect('/home');
    });
    
    //homepage of users
    app.get('/home', loginCheck, function(req, res){
       model.createHomePage(req, res);
    });
    
    app.post('/createAccount', function(req, res){
         model.createAccount(req, res);
    });
    
    app.post('/createOrganization', loginCheck, function(req, res){
       model.createOrganization(req, res);
    });
    
    app.get('/organization/:id', function(req, res){
        model.loadOrganizationPage(req, res);
    });
    
    //check to make sure that user has permission to join
    app.post('/organization/:id/join', loginCheck, function(req, res){
        model.joinUser(req, res);
    });
    
    //check to make sure that user has permission to create event
    //add date and time picker
    app.post('/organization/:id/createEvent', loginCheck, function(req, res){
        //console.log('create event: ' + req.body.name);
       model.createEvent(req, res); 
    });
    
    app.post('/organization/:id/submitRSVP', loginCheck, function(req, res){
        model.submitRSVP(req, res);
    });
    
    app.get('/organization/:id/editEvent/:eventId', loginCheck, function(req, res){
        model.createEventEditPage(req, res);
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
    
    app.get('/signIn', loginCheck, function(req, res){
        res.sendFile('/views/signIn.html', {root: __dirname + '/../public'});
    });
    
    function loginCheck(req, res, next){
        if (req.user){
		  next();
		}else{
		  res.redirect('/');
		}
	}
    
}