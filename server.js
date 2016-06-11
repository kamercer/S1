"use strict"
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var express = require('express');
var app = express();

//This is done to fix the problem of a lack of trailing slash in the url
app.enable('strict routing');

mongoose.connect('mongodb://localhost/S1');

var db = mongoose.connection;
db.on('open', function(){
    console.log('database connected');
});

db.on('error', function(){
    console.log('database not connected');
});

//global.db = db;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/views');

var port = 3000;

require('./app/models/schemas.js')

app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.use(session({
    saveUninitialized: true,
    resave: true,
    secret: 'OurSuperSecretCookieSecret'
}));


app.use(passport.initialize());
app.use(passport.session());

var passportJS = require('./config/passport');
var passportJS = passportJS();

//makes everything in the public folder accessible
app.use(express.static('public'));

require('./app/routes.js')(app)

app.listen(port, "0.0.0.0", function(){
    console.log('server is running in port ' + port);    
});

