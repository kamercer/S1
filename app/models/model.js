"use strict"
var User = require('mongoose').model('User');
var Organization = require('mongoose').model('Organization');
var Event = require('mongoose').model('Event');
var MemberOrganizationAssociation = require('mongoose').model('MemberOrganizationAssociation');
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
        temp.push(req.user._id);
        
        var newOrganization = new Organization({name: req.body.name, summary: req.body.summary, admins: temp, members : temp});
        newOrganization.save(function(err, newDoc, numAffected){
            
            var newMemberOrganizationAssociation = new MemberOrganizationAssociation({user : req.user._id, organization: newOrganization._id, hours: 0});
            newMemberOrganizationAssociation.save(function(err, newDoc1, numAffected){
                    
                User.findByIdAndUpdate(req.user._id, {$addToSet: {adminOf : newOrganization._id, memberOf : newOrganization._id /*,memberOrganizationAssociation: newDoc1._id*/}}, {new : true}, function(err2, doc2){
                    res.redirect('/');
                });
            });
        });
    },
    
    loadOrganizationPage : function(req, res){
        Organization.findOne({name : req.params.id}).populate('events').exec(function(err, organization){
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
                    MemberOrganizationAssociation.find({'organization' : organization._id}).populate('user').exec(function(err, docs){
                        //console.log(err);
                        //console.log(docs);
                        
                        res.render('organization', {name : organization.name, summary: organization.summary, stranger: false, status : "admin", statusNumber: 3, user: req.user.username, members : docs, events : organization.events});
                    });
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
                
                console.log('this hit');
                
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
    
    createEventEditPage: function(req, res){
        
        eventUserRecord.find({event : req.params.eventId}).populate('event user unregisteredUser').exec(function(err, docs){
            console.log(err);
            console.log('createEventEditPage: ' + docs);
            
            if(err == null && docs.length > 0){
                res.render('eventEdit', {qrcode : docs[0].event.eventIdentifier, docs : docs}); 
            }else{
                res.end();
            }
        });
    },
    
    //this needs work
    submitRSVP : function(req, res){
        
        eventUserRecord.findOne({event : req.body.id}, function(err, doc){
            
            console.log('err:' + err);
            console.log(doc);
            
            if(doc == null){
                
                var newEventUserRecord = new eventUserRecord({event : req.body.id, user : req.user._id});
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
    
    downloadStream.once('end', function(){
        console.log('end');
    });
    
    downloadStream.once('error', function(error){
        console.log(error);
    });
    
    downloadStream.pipe(res);
}