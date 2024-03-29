var mongoose = require('mongoose');

var organizationSchema = mongoose.Schema({
    name                          : String,
    nickname                      : {type : String, unique: true},
    summary                       : String,
    events                        : [{type : mongoose.Schema.Types.ObjectId, ref: 'Event'}],
    admins                        : [{type : mongoose.Schema.Types.ObjectId, ref: 'User'}],
    members                       : [{type : mongoose.Schema.Types.ObjectId, ref: 'User'}],
    memberOrganizationAssociation : [{type : mongoose.Schema.Types.ObjectId, ref : 'MemberOrganizationAssociation'}],
    organizationImage             : {type : mongoose.Schema.Types.ObjectId, ref : 'fs.files'},
    individualServiceGoal         : Number,
    OrganizationServiceGoal       : Number,
    applyToJoin                   : Boolean,
    waitingUsers                  : [{type : mongoose.Schema.Types.ObjectId, ref: 'User'}],
    serviceEmail                  : String,
    stripeAccount                 : {type : mongoose.Schema.Types.ObjectId, ref : 'MemberOrganizationAssociation'},
    fee                           : Number
});

var eventSchema = mongoose.Schema({
    name             : String,
    description      : String,
    startDate        : Date,
    endDate          : Date,
    organization     : {type : mongoose.Schema.Types.ObjectId, ref : 'Organization'},
    createdBy        : {type : mongoose.Schema.Types.ObjectId, ref : 'User'},
    public           : Boolean,
    eventIdentifier  : String,
    eventUserRecords : [{type : mongoose.Schema.Types.ObjectId, ref : 'eventUserRecord'}],
    eventPhoto       : {type : mongoose.Schema.Types.ObjectId, ref : 'fs.files'},
    location         : {type : {type : String, default : 'Point'}, coordinates : [Number], address : String}
});

eventSchema.index({ location : '2dsphere' });

var eventUserRecordSchema = mongoose.Schema({
    parentEvent      : {type : mongoose.Schema.Types.ObjectId, ref : 'Event'},
    user             : {type : mongoose.Schema.Types.ObjectId, ref : 'User'},
    unregisteredUser : {type : mongoose.Schema.Types.ObjectId, ref : 'UnregisteredUser'},
    signIn           : Date,
    signOut          : Date,
});

var userSchema = mongoose.Schema({
   facebookID                    : String,
   googleID                      : String,
   first_name                    : String,
   last_name                     : String,
   password                      : String,
   email                         : String,
   memberOf                      : [{type : mongoose.Schema.Types.ObjectId, ref : 'Organization'}],
   adminOf                       : [{type : mongoose.Schema.Types.ObjectId, ref : 'Organization'}],
   eventsAttended                : [{type : mongoose.Schema.Types.ObjectId, ref : 'Event'}], //not sure if I need to use this
   memberOrganizationAssociation : [{type : mongoose.Schema.Types.ObjectId, ref : 'MemberOrganizationAssociation'}],
   eventUserRecords              : [{type : mongoose.Schema.Types.ObjectId, ref : 'eventUserRecord'}],
   profilePic                    : {type : mongoose.Schema.Types.ObjectId, ref : 'fs.files'},
   homeLocation                  : {type : {type : String, default : 'Point'}, coordinates : [Number], address : String}
});

var unregisteredUserSchema = mongoose.Schema({
    name : String,
    email : String,
    event : {type : mongoose.Schema.Types.ObjectId, ref : 'eventUserRecord'}
});

//change name
var MemberInOrganizationSchema = mongoose.Schema({
    user             : {type : mongoose.Schema.Types.ObjectId, ref : 'User'},
    organization     : {type : mongoose.Schema.Types.ObjectId, ref : 'Organization'},
    hours            : {type : Number, min : 0},
    stripeAccount    : {state : String}
});

mongoose.model('eventUserRecord', eventUserRecordSchema);
mongoose.model('User', userSchema);
mongoose.model('UnregisteredUser', unregisteredUserSchema);
mongoose.model('Organization', organizationSchema);
mongoose.model('Event', eventSchema);
mongoose.model('MemberOrganizationAssociation', MemberInOrganizationSchema);