"use strict"
var User = require('mongoose').model('User');
var Organization = require('mongoose').model('Organization');
var Event = require('mongoose').model('Event');
var MemberInOrganizationSchema = require('mongoose').model('MemberOrganizationAssociation');
var eventUserRecord = require('mongoose').model('eventUserRecord');
var UnregisteredUser = require('mongoose').model('UnregisteredUser');

var mongoose = require('mongoose');
var mongodb = require('mongodb');
var fs = require('fs');

module.exports = {
    createAccount : function(req, res){
        if(req.body.username == null || !req.body.username || req.body.password == null || !req.body.password || req.body.email == null || !req.body.email){
            console.log('user or password or email is null or undefined');
            res.end();
            return;
        }
        
        //encrypt password later
        var newAccount = new User({username: req.body.username, password: req.body.password, email: req.body.email});
        
        User.find({username : req.body.username}, {email : req.body.email}, function(err, docs){
            if(docs.length > 0){
                console.log('new accout not made');
                res.redirect('/');
                return;
            }else{
                newAccount.save(function(err, newAccount, numAffected){
                    console.log("create new Account error : " + err);
                    res.redirect('/');
                });
            }
        });
    },
    
    //debugging reasons   send email or have admin look at new organization
    createOrganization : function(req, res){
        
        if(req.body.name == null || !req.body.name || req.body.summary == null || !req.body.summary){
            console.log('name or summary is null or undefined');
            res.end();
            return;
        }
        
        var temp = [];
        temp.push(req.user);
        
        var newOrganization = new Organization({name: req.body.name, summary: req.body.summary, admins: temp, members : temp});
        newOrganization.save(function(err, newDoc, numAffected){
            
            var newMemberOrganizationAssociation = new MemberInOrganizationSchema({user : req.user._id, organization: newOrganization._id, hours: 0, events : []});
            newMemberOrganizationAssociation.save(function(err, newDoc1, numAffected){
                    
                User.findByIdAndUpdate(req.user._id, {$addToSet: {adminOf : newOrganization._id, memberOf : newOrganization._id ,memberOrganizationAssociation: newDoc1._id}}, {new : true}, function(err2, doc2){
                    res.redirect('/');
                });
            });
        });
    },
    
    //needs work?
    loadOrganizationPage : function(req, res){

        //find the requested organization and populate the members and events
        Organization.findOne({name : req.params.id}).populate('members admins events').exec(function(err, organization){

            if(organization == null){
                res.end();
                console.log('loadOrganizationPage: organization is null');
                return;
            }

            //if there is an user logged in
            if (req.user){

                //This checks if the user is a member of the organization
                var memberinOrganization = organization.members.some(function(value){
                        return value._id.equals(req.user._id);
                    });

                //If the member is not part of the organization, render the page appropriately
                if (!memberinOrganization){
                    res.render('organization', {name : organization.name, summary: organization.summary, statusNumber: 1, user: req.user, members : null, events : organization.events});
                    return;
                }

                //at this point, user is either a member or an admin of the specified organization  
                //This gets all the users that are a member of the organization, it populates their memberOrganizationAssociation.  I forget what the rest does, need to review this query
                User.find({_id : {$in : organization.members}}).populate({path : 'memberOrganizationAssociation' , match : {organization : organization._id}, options : {limit : 1}}).populate({path : 'eventUserRecords', select : {event : {$in : organization.events}}}).exec(function(err, docs){
                    
                    //check if user is an admin of the specified organization and respond appropriately
                    var isMemberAdmin = organization.admins.some(function(value){
                        return value._id.equals(req.user.id);
                    });

                    if(isMemberAdmin){
                        res.render('organization', {name : organization.name, summary: organization.summary, statusNumber: 3, user: req.user, members : docs, events : organization.events});
                    }else{
                        res.render('organization', {name : organization.name, summary: organization.summary, statusNumber: 2, user: req.user, members : docs, events : organization.events});
                    }
                });
            }else{//if there is not an user logged in
                res.render('organization', {name : organization.name, summary: organization.summary, statusNumber: 0, user: null, members : null, events : organization.events.filter(filterPublicEvents)});
            }
        });
        

        
        /*
        Organization.findOne({name : req.params.id}).populate('members memberOrganizationAssociation events').exec(function(err, organization){
            //console.log('load organization page error: ' + err);
            //console.log('load organization page: ' + organization);
            if (organization != null){
                
               //stranger
                if (req.user == null || req.user == undefined){
                    res.render('organization', {name : organization.name, summary: organization.summary, stranger: false, status : "stranger", statusNumber: 0, user: 'null', members : null, events : organization.events.filter(filterPublicEvents)});
                    return;
                }
                
                //admin
                if(req.user.adminOf.indexOf(organization._id) != -1){
                    eventUserRecord.find({event : {$in : organization.events}}).populate('user').exec(function(err, docs){
                        console.log(err);
                        console.log(docs);
                        
                        res.render('organization', {name : organization.name, summary: organization.summary, stranger: false, status : "admin", statusNumber: 3, user: req.user, members : organization.members, events : organization.events});
                    });
                    
                    
                    //MemberOrganizationAssociation.find({'organization' : organization._id}).populate('user').exec(function(err, docs){
                        //console.log(err);
                        //console.log(docs);
                        
                        //res.render('organization', {name : organization.name, summary: organization.summary, stranger: false, status : "admin", statusNumber: 3, user: req.user.username, members : docs, events : organization.events});
                    //});
                    //User.find({_id : {$in: organization.members}}).populate('memberOrganizationAssociation').exec(function(err, docs){
                        //console.log(docs);
                        //res.render('organization', {name : organization.name, summary: organization.summary, stranger: false, status : "admin", statusNumber: 3, user: req.user.username, members : docs, events : organization.events});
                    //});
                    return;
                }
                
                //user not affiliated        
                if(req.user.memberOf.indexOf(organization._id) == -1){
                    res.render('organization', {name : organization.name, summary: organization.summary, stranger: false, status : "member not affiliated", statusNumber: 1, user: req.user.username, members : null, events : organization.events.filter(filterPublicEvents)});
                    return;  
                }
                
                //member
                if(req.user.memberOf.indexOf(organization._id) != -1){
                    res.render('organization', {name : organization.name, summary: organization.summary, stranger: false, status : "member affiliated", statusNumber: 2, user: req.user.username, members : null, events : organization.events});
                    //return;
                }
         
            }else{ //handles if organization name does not exist
                res.render('organization', {});
            }
        });
        */
    },
    
    joinUser : function(req, res){
        Organization.findOneAndUpdate({name : req.params.id}, {$addToSet: {members: req.user._id}}, {new : true}, function(err1, doc1){
            console.log('joinUser organization : ' + err1);
            console.log(doc1);
            if(err1 == null){
                User.findByIdAndUpdate(req.user._id, {$addToSet: {memberOf : doc1._id}}, {new : true}, function(err2, doc2){
                    console.log('joinUser User: ' + err2);
                    console.log(doc2);
                    
                    var newMemberOrganizationAssociation = MemberOrganizationAssociation({user : req.user._id, organization : doc1._id, hours : 0});
                    newMemberOrganizationAssociation.save(function(err, newDoc, numAffected){
                        res.end();
                    });
                });
            }else{
                res.end();
            }
        });
    },
    
    createEvent : function(req, res){
        uploadImage(req, res).then(function(eventPhotoId){
            
            Organization.findOne({name : req.params.id}, function(err, organization){
                
                if(req.body.name == null || !req.body.name || req.body.sDate == null || !req.body.sDate || req.body.eDate == null || !req.body.eDate || organization == null || req.body.public == null || !req.body.public){
                    console.log('CreateEvent error: something is undefined or null');
                    res.end();
                    return;
                }
                
                var newEvent = new Event({name : req.body.name,
                startDate : new Date(req.body.sDate),
                endDate : new Date(req.body.eDate),
                organization : organization._id,
                createdBy : req.user._id,
                public : req.body.public,
                eventIdentifier : createEventId(),
                eventPhoto : eventPhotoId});
                
                newEvent.save(function(err, savedEvent, numAffected){
                    console.log('new event err : ' + err);
                    console.log('new event savedEvent : ' + savedEvent);
                    if(savedEvent != null){
                        organization.update({$addToSet : {events : savedEvent._id}}, function(err, doc){
                        console.log('update add event organization err: ' + err);
                        console.log('update add event organization doc: ' + doc); 
                        res.end();
                        });
                    }else{
                        res.end();
                    }
                });
            });
        })
    },
    
    //this query may be incorrect
    /*
    getUserOrganizations : function(req, res){
        Organization.find({admins : {$all : req.user._id}}, function(err, docs){
           console.log('getUserOrganizations err: ' + err);
           console.log('getUserOrganizations docs:' + docs);
           
           res.render('log', {orgs : docs});
        });
    },
    */
    
    //needs more work
    logEventHours : function(req, res){
        
        Event.findOne({eventIdentifier : req.body.data}).populate('eventUserRecords').exec(function(err, doc){
            console.log('a ' + err);
            console.log(doc);
            
            if(doc != null){
                var temp = doc.eventUserRecords.filter(function(value, index){
                    if(value.user.equals(req.user._id)){
                        return true;
                    }else{
                        return false;
                    }
                });
            }else{
                res.end();
                return;
            }
            
            console.log(temp);
            var updateRecord = {};
            if(temp[0].signIn == null){
                updateRecord.signIn = new Date();
            }else if(temp[0].signOut == null){
                updateRecord.signOut = new Date();
            }else{
                res.end();
                return;
            }
            
            console.log(updateRecord);
            eventUserRecord.findOneAndUpdate({user : req.user._id, event : doc._id}, updateRecord, {new : true}, function(err, doc){
                console.log(err);
                console.log(doc);
                
                res.end();
            });
        });
    },
        
    //I dont think this is used
    getUserEvents : function(req, res){
        //improve query
        Organization.findOne({name : req.body.organizationName}).populate('events', 'name').select('events').exec(function(err, doc){
            
            //could this be improved?
            var temp = [];
                     
            for(var i = 0; i < doc.events.length; i++){
                console.log(doc.events[i].name);
                temp.push(doc.events[i].name);
            }
            
            res.send(temp);
        });
    },
    
    createHomePage : function(req, res){
        Organization.find({_id : {$in : req.user.memberOf}}).populate('events').exec(function(err, docs){            
            //console.log(err);
            //console.log(docs);
            
            //There is probably a better way to do this
            var events = [];
            for(var i = 0; i < docs.length; i++){
                docs[i].events.forEach(function(value, index){
                    if(value.startDate >= new Date()){      
                        events.push(value);     
                    }
                });
            }
            
            res.render('home', {organizations : docs, events: events, user: req.user.username});
        });
    },
    
    //return to this and improve query
    createEventEditPage: function(req, res){
        Event.findOne({_id : req.params.eventId}, function(err, event){
            eventUserRecord.find({event : req.params.eventId}).populate('user unregisteredUser').exec(function(err, docs){
                console.log(err);
                console.log('createEventEditPage: ' + docs);
                
                if(err == null){
                    res.render('eventEdit', {qrcode : event.eventIdentifier, docs : docs}); 
                }else{
                    res.end();
                }
            });
        });
    },
    
    //could I cut down the database calls?
    submitRSVP : function(req, res){
        //req.body.id is an event id
        
        //verify that req.body.id is of an objectId form
        if (!mongoose.Types.ObjectId.isValid(req.body.id)){
            console.log('submitRSVP: req.body.id is not a valid objectID form');
            res.end();
            return;
        }
        
        //verify that req.body.id is an actual event id
        Event.findById(req.body.id, function(err, parentEvent){
            if(err != null){
                console.log('submitRSVP: parent event does not exist');
                res.end();
                return;
            }
            
            //check if eventUserRecord already exists
            eventUserRecord.find({event : parentEvent._id, user : req.user.id}, function(err, docs){
                if(err != null){
                    console.log('submitRSVP: error when checking for existing eventUserRecords');
                    res.end();
                    return;
                }
                
                if(docs.length > 0){
                    console.log('submitRSVP: eventUserRecords already exists');
                    res.end();
                    return;
                }
                
                //create new eventUserRecord and save it
                var newEventUserRecord = new eventUserRecord({parentEvent : parentEvent._id, user : req.user._id});
                newEventUserRecord.save(function(err, newRecord, numAffected){
                    if(err != null){
                        console.log('submitRSVP: error saving newEventUserRecord');
                        res.end();
                        return;
                    }
                    
                    res.end();
                    return;
                });
            });
        });
        
                            /*
                    //update parentEvent to include newEventUserRecord
                    Event.findByIdAndUpdate(parentEvent._id, {$addToSet : {eventUserRecords : newRecord._id}}, function(err, doc){
                        if(err != null){
                            console.log('submitRSVP: error updating parentEvent with newEventUserRecords');
                        }
                            
                        res.end();
                        return;
                    });
                    */
        
        /*
        eventUserRecord.findOne({event : req.body.id}, function(err, doc){
            
            console.log('err:' + err);
            console.log(doc);
            
            if(doc == null){
                
                var newEventUserRecord = new eventUserRecord({event : mongoose.Types.ObjectId(req.body.id), user : req.user._id});
                newEventUserRecord.save(function(err, record, numAffected){
                    console.log(err);
                    
                    Event.findOneAndUpdate({_id : req.body.id}, {$addToSet : {eventUserRecords : record._id}}, {new : true}, function(err, eventDoc){
                        console.log('d ' + err);
                        console.log(eventDoc);
                        res.end();
                    });
                });
            }else{
                Event.findOneAndUpdate({_id : req.body.id}, {$addToSet : {eventUserRecords : doc._id}}, {new : true}, function(err, eventDoc){
                    console.log('d ' + err);
                    console.log(eventDoc);
                    res.end();
                });
            }
        });
        */
        
        /*
        Event.findOneAndUpdate({_id : req.body.id}, {$addToSet : {usersGoing : req.user._id}}, {new : true}, function(err, doc){
            console.log(err);
            console.log(doc);
            
           User.findOneAndUpdate({_id : req.user._id}, {$addToSet : {eventsAttended : req.body.id}}, {new: true}, function(err, doc){
                console.log('submitRSVP err: ' + err);
                console.log('submitRSVP doc: ' + doc);
                res.end();
            });
        });
        */   
    },
    
    //check event id
    submitUnregisteredUser : function(req, res){
        
        var sDate = new Date(req.body.inputs[1]);
        var eDate = new Date(req.body.inputs[2]);
        
        var newEventUserRecord = new eventUserRecord({event : req.params.eventId, signIn : sDate, signOut : eDate});
        newEventUserRecord.save(function(err, record, numAffected){
            console.log(err);
            
            var newUnregisteredUser = new UnregisteredUser({name : req.body.inputs[0], email : req.body.inputs[3], event : record._id});
            
            newUnregisteredUser.save(function(err, record2, numAffected){
                console.log(err);
                console.log(record2);
                
                eventUserRecord.findByIdAndUpdate(record._id, {unregisteredUser : record2._id}, {new : true}, function(err, doc){
                    console.log(err);
                    
                    res.send([record2.name, doc.signIn, doc.signOut, record2.email, doc._id]);
                });
            });
        });
    },
    
    //allows an admin to update when an user signed in or out
    updateUser : function(req, res){       
        var sDate = new Date(req.body.inputs[0]);
        var eDate = new Date(req.body.inputs[1]);
        eventUserRecord.findByIdAndUpdate(req.body.id, {signIn : sDate, signOut : eDate}, {new : true}, function(err, doc){
            console.log(err);
            console.log(doc);
            
            res.send([doc.signIn, doc.signOut]);
        });
    },
    
    changeProfilePic : function(req, res){
        uploadImage(req, res).then(function(imageId){
            if(imageId == null){
                res.end();
                console.log('profile pic upload failed');
                return;
            }
            
            User.findByIdAndUpdate(req.user._id, {profilePic : imageId}, {new : true}, function(err, doc){
                console.log(err);
                console.log(doc);
                
                res.end();
            });
        });
    },
    
    getProfilePic : function(req, res){
        retrieveProfilePic(req, res);
    }
};

function uploadImage(req, res){
    return new Promise(function(resolve, reject){
        if(req.files.length > 0){            
            var db = mongoose.connection;
            
            var readStream = fs.createReadStream(req.files[0].path);
            
            var bucket = new mongodb.GridFSBucket(db.db);
            var uploadStream = bucket.openUploadStream(req.files[0].originalName);
            
            uploadStream.once('finish', function(){
                console.log('upload image success: ' + uploadStream.id);
                resolve(uploadStream.id);
            });
            
            uploadStream.once('error', function(err){
                console.log('upload image error: ' + err);
            });
            
            readStream.pipe(uploadStream);
        }else{
            resolve(null);
        }
    });
}

function createEventId(){
    var milliseconds = (new Date().getTime()  % 1000000);
    
    var random = Math.floor(Math.random() * 10000);
    
    var id = random.toString() + "-" + milliseconds.toString();
    
    console.log(id);
    
    return id;
}


function filterPublicEvents(value){
    return value.public;
}

function retrieveProfilePic(req, res){
    var db = mongoose.connection;
    
    var bucket = new mongodb.GridFSBucket(db.db);
    
    console.log(req);
    
    if(req.user.profilePic == null || req.user.profilePic == undefined){
        res.end();
        console.log('no profile pic');
        return;
    }
    
    var downloadStream = bucket.openDownloadStream(req.user.profilePic);
    
    /* current unnecessary code
    downloadStream.once('end', function(){
        console.log('end');
    });
    */
    
    downloadStream.once('error', function(error){
        console.log(error);
    });
    
    downloadStream.pipe(res);
}