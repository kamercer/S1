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

    /* not used 
    createAccount : function(req, res){

        //check for required fields
        if(!req.body.fName || !req.body.lName || !req.body.password || !req.body.email){
            res.end();
            console.log('createAccount: user or password or email is null or undefined');
            return;
        }
        
        //encrypt password later
        var newAccount = new User({first_name: req.body.fName, last_name: req.body.lName, password: req.body.password, email: req.body.email});
        
        User.find({email : req.body.email}, function(err, users){
            if(docs.length > 0){
                console.log('createAccount: account with email already exists');
                res.redirect('/');
                return;
            }else{
                newAccount.save(function(err, newAccount, numAffected){
                    if(err != null){
                        res.redirect('/login');
                    }else{
                        console.log("createAccount error: " + err);
                    }
                });
            }
        });
    },
    */

    createOrganization: function (req, res) {

        if (!req.body.name || !req.body.nickname || !req.body.summary) {
            res.end();
            console.log('createOrganization: a field is undefined');
            return;
        }

        //I am removing the characters / ? ' ;
        var legalCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:#[]@!$&\()*+,=';
        for(var i = 0; i < req.body.nickname.length; i++){
            if(legalCharacters.indexOf(req.body.nickname[i]) < 0){
                //nickname contains illegal characters
                console.log('createOrganization : nickaname contains illegal characters');
                res.end();
                return;
            }
        }

        //check if nickname already exists
        Organization.find({ nickname: req.body.nickname }, function (err, docs) {
            if (!err) {
                if (docs === null) {
                    var newOrganization = new Organization({ name: req.body.name, nickname: req.body.nickname, summary: req.body.summary, admins: [req.user], members: req.user });
                    newOrganization.save(function (err, newOrg, numAffected) {

                        if (err === null) {
                            var newMemberOrganizationAssociation = new MemberInOrganizationSchema({ user: req.user._id, organization: newOrganization._id, hours: 0, events: [] });
                            newMemberOrganizationAssociation.save(function (err1, newMemberOrg, numAffected) {

                                if (err === null) {
                                    User.findByIdAndUpdate(req.user._id, { $addToSet: { adminOf: newOrganization._id, memberOf: newOrganization._id, memberOrganizationAssociation: newMemberOrg._id } }, { new: true }, function (err2, doc2) {

                                        if (err === null) {
                                            if (doc2 !== null) {
                                                res.redirect('/organization/' + newOrg.nickname);
                                            } else {
                                                console.log('createOrganization: user was not found');
                                                res.end();
                                            }
                                        } else {
                                            console.log('createOrganization error: ' + err);
                                            res.end();
                                        }
                                    });
                                }
                            });
                        } else {
                            console.log("createOrganization error: " + err);
                            res.redirect('/home');
                        }
                    });
                } else {
                    console.log('createOrganization: nickname already exists');
                    res.end();
                }
            } else {
                console.log('createOrganization error: ' + err);
                res.end();
            }
        });
    },


    //needs work?
    //This function determines the status of an user in an organization and loads the appropriate organization page
    loadOrganizationPage: function (req, res) {

        //find the requested organization and populate the members and events
        Organization.findOne({ nickname: req.params.id }).populate({ path: 'members admins events', populate: { path: 'eventUserRecords' } }).exec(function (err, organization) {

            //checks if the query did not find the organization and if so, exits
            if (organization === null) {
                res.end();
                console.log('loadOrganizationPage: organization is null(probably does not exist)');
                return;
            }

            //if there is an user logged in
            if (req.user) {

                //This checks if the user is a member of the organization
                var memberinOrganization = organization.members.some(function (value) {
                    return value._id.equals(req.user._id);
                });

                //If the member is not part of the organization, render the page appropriately
                if (!memberinOrganization) {
                    res.render('tempOrganization', { org: organization, summary: organization.summary, statusNumber: 1, user: req.user, members: null, events: organization.events.filter(filterPublicEvents) });
                    return;
                }

                //at this point, user is either a member or an admin of the specified organization  
                //This gets all the users that are a member of the organization, it populates their memberOrganizationAssociation.  I forget what the rest does, need to review this query
                User.find({ _id: { $in: organization.members } }).populate({ path: 'memberOrganizationAssociation', match: { organization: organization._id } }).populate({ path: 'eventUserRecords', select: { event: { $in: organization.events } } }).exec(function (err, docs) {
                    //check if user is an admin of the specified organization and respond appropriately
                    var isMemberAdmin = organization.admins.some(function (value) {
                        return value._id.equals(req.user._id);
                    });

                    organization.events.forEach(function (element, index) {
                        organization.events[index].RSVPCheck = true;
                        element.eventUserRecords.forEach(function (element1, index1) {
                            if (element1.user.equals(req.user._id)) {
                                organization.events[index].RSVPCheck = false;
                                return;
                            }
                        });
                    });

                    if (isMemberAdmin) {
                        res.render('tempOrganization', { org: organization, summary: organization.summary, statusNumber: 3, user: req.user, members: docs, events: organization.events });
                    } else {
                        res.render('tempOrganization', { org: organization, summary: organization.summary, statusNumber: 2, user: req.user, members: docs, events: organization.events });
                    }
                });
            } else {//if there is not an user logged in
                res.render('tempOrganization', { org: organization, summary: organization.summary, statusNumber: 0, user: null, members: null, events: organization.events.filter(filterPublicEvents) });
            }
        });
    },

    //This method adds a new member to an organization by updating organization, member and creating a new memberOrganization
    //TODO: if one addition fails, should change others
    joinUser: function (req, res) {
        Organization.findOne({ nickname: req.params.id }, function (err, org) {
            if (org.applyToJoin === true) {
                Organization.findOneAndUpdate({ nickname: req.params.id }, { $addToSet: { waitingUsers: req.user._id } }, function (err, org) {
                    if (err === null) {
                        if (org !== null) {
                            res.end();
                        } else {
                            console.log('joinUser: org is null');
                            res.end();
                        }
                    } else {
                        console.log('joinUser error: ' + err);
                        res.end();
                    }
                });
            } else {
                Organization.findOneAndUpdate({ nickname: req.params.id }, { $addToSet: { members: req.user._id } }, { new: true }, function (err, org) {
                    if (err === null) {
                        if (org !== null) {
                            var newMemberOrganizationAssociation = new MemberInOrganizationSchema({ user: req.user._id, organization: org._id, hours: 0 });
                            newMemberOrganizationAssociation.save(function (err, newDoc, numAffected) {
                                if (err === null) {
                                    User.findByIdAndUpdate(req.user._id, { $addToSet: { memberOf: org._id, memberOrganizationAssociation: newDoc._id } }, { new: true }, function (err2, user) {
                                        if (err2 === null) {
                                            res.end();
                                        } else {
                                            console.log("joinUser error: " + err2);
                                            res.end();
                                        }
                                    });
                                } else {
                                    console.log("joinUser error : " + err);
                                    res.end();
                                }
                            });
                        } else {
                            console.log('joinUser org is null');
                            res.end();
                        }
                    } else {
                        console.log('joinUser error: ' + err);
                        res.end();
                    }
                });
            }
        });
    },

    createEvent: function (req, res) {
        uploadImage(req, res).then(function (eventPhotoId) {

            Organization.findOne({ nickname: req.params.id }, function (err, organization) {

                if (!req.body.name || !req.body.sDate || !req.body.eDate || !organization || !req.body.public) {
                    console.log('CreateEvent error: something is undefined or null');
                    res.sendStatus(400);
                    return;
                }

                var sDate = new Date(req.body.sDate);
                var eDate = new Date(req.body.eDate);

                if (isNaN(sDate) || isNaN(eDate)) {
                    res.sendStatus(400);
                    return;
                }

                var newEvent = new Event({
                    name: req.body.name,
                    startDate: sDate,
                    endDate: eDate,
                    organization: organization._id,
                    createdBy: req.user._id,
                    public: req.body.public,
                    //eventIdentifier : createEventId(), currently not necessary
                });

                if (req.body.description) {
                    newEvent.description = req.body.description;
                }

                if (eventPhotoId) {
                    newEvent.eventPhoto = eventPhotoId;
                }

                //validate this later
                if (req.body.lat && req.body.lng && req.body.address) {
                    newEvent.location = { type: 'Point', coordinates: [req.body.lat, req.body.lng], address: req.body.address };
                } else {
                    newEvent.location = undefined;
                }

                /*
                var newEvent = new Event({name : req.body.name,
                description : req.body.description,
                startDate : new Date(req.body.sDate),
                endDate : new Date(req.body.eDate),
                organization : organization._id,
                createdBy : req.user._id,
                public : req.body.public,
                //eventIdentifier : createEventId(), currently not necessary
                eventPhoto : eventPhotoId,
                location : {type : 'Point', coordinates : [req.body.lat, req.body.lng], address : req.body.address}
                });
                */

                newEvent.save(function (err, savedEvent, numAffected) {

                    if (err === null) {
                        organization.update({ $addToSet: { events: savedEvent._id } }, function (err, doc) {
                            if (err === null) {
                                res.sendStatus(200);
                            } else {
                                console.log("createEvent error: " + err);
                                res.sendStatus(500);
                            }
                        });
                    } else {
                        console.log("createEvent error: " + err);
                        res.sendStatus(500);
                    }
                });
            });
        });
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
    logEventHours: function (req, res) {

        Event.findOne({ eventIdentifier: req.body.data }).populate('eventUserRecords').exec(function (err, doc) {

            var temp;
            if (doc !== null) {
                temp = doc.eventUserRecords.filter(function (value, index) {
                    if (value.user.equals(req.user._id)) {
                        return true;
                    } else {
                        return false;
                    }
                });
            } else {
                res.end();
                return;
            }

            var updateRecord = {};
            if (temp[0].signIn === null) {
                updateRecord.signIn = new Date();
            } else if (temp[0].signOut === null) {
                updateRecord.signOut = new Date();
            } else {
                res.end();
                return;
            }

            eventUserRecord.findOneAndUpdate({ user: req.user._id, event: doc._id }, updateRecord, { new: true }, function (err, doc) {
                console.log(err);
                console.log(doc);

                res.end();
            });
        });
    },

    //I dont think this is used
    getUserEvents: function (req, res) {
        //improve query
        Organization.findOne({ name: req.body.organizationName }).populate('events', 'name').select('events').exec(function (err, doc) {

            //could this be improved?
            var temp = [];

            for (var i = 0; i < doc.events.length; i++) {
                console.log(doc.events[i].name);
                temp.push(doc.events[i].name);
            }

            res.send(temp);
        });
    },

    createHomePage: function (req, res) {
        Organization.find({ _id: { $in: req.user.memberOf } }).populate('events').exec(function (err, docs) {

            //There is probably a better way to do this
            var upcomingEvents = [];
            for (var i = 0; i < docs.length; i++) {
                docs[i].events.forEach(function (value, index) {
                    if (value.startDate >= new Date()) {
                        upcomingEvents.push(value);
                    }
                });
            }

            if (req.user.homeLocation.coordinates.length > 0) {
                Event.find({
                    location:
                    {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: req.user.homeLocation.coordinates
                            },
                            $maxDistance: 1000 //meters
                        }
                    }
                },
                    function (err, nearbyEvents) {
                        if (err === null) {
                            res.render('tempHome', { organizations: docs, upcomingEvents: upcomingEvents, nearbyEvents: nearbyEvents, user: req.user });
                        } else {
                            console.log("createHomePage error: " + err);
                            res.end();
                        }
                    });
            } else {
                res.render('tempHome', { organizations: docs, upcomingEvents: upcomingEvents, nearbyEvents: [], user: req.user });
            }
        });
    },

    //return to this and improve query
    createEventEditPage: function (req, res) {
        Event.findOne({ _id: req.params.eventId }, function (err, event) {
            eventUserRecord.find({ event: req.params.eventId }).populate('user unregisteredUser').exec(function (err, docs) {

                if (err === null) {
                    res.render('eventEdit', { qrcode: event.eventIdentifier, docs: docs });
                } else {
                    res.end();
                }
            });
        });
    },

    //could I cut down the database calls?
    RSVP: function (req, res) {
        //req.body.id is an event id

        //verify that req.body.id is of an objectId form
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log('RSVP: ' + req.params.id + ' is not a valid objectID form');
            res.end();
            return;
        }

        //verify that req.body.id is an actual event id
        Event.findById(req.params.id, function (err, parentEvent) {
            if (err !== null) {
                console.log('RSVP: parent event does not exist');
                res.end();
                return;
            }

            //check if eventUserRecord already exists
            eventUserRecord.find({ event: parentEvent._id, user: req.user.id }, function (err, docs) {
                if (err !== null) {
                    console.log('RSVP: error when checking for existing eventUserRecords');
                    res.end();
                    return;
                }

                if (docs.length > 0) {
                    console.log('RSVP: eventUserRecords already exists');
                    res.end();
                    return;
                }

                //create new eventUserRecord and save it
                var newEventUserRecord = new eventUserRecord({ parentEvent: parentEvent._id, user: req.user._id });
                newEventUserRecord.save(function (err, newRecord, numAffected) {
                    if (err !== null) {
                        console.log('RSVP error saving newEventUserRecord: ' + err);
                        res.end();
                        return;
                    }

                    Event.findByIdAndUpdate(parentEvent._id, { $push: { eventUserRecords: newRecord._id } }, function (err, s) {
                        if (err !== null) {
                            console.log('RSVP error updating event: ' + err);
                        }

                        res.end();
                    });
                });
            });
        });
    },

    //check event id
    submitUnregisteredUser: function (req, res) {

        var sDate = new Date(req.body.inputs[1]);
        var eDate = new Date(req.body.inputs[2]);

        var newEventUserRecord = new eventUserRecord({ event: req.params.eventId, signIn: sDate, signOut: eDate });
        newEventUserRecord.save(function (err, record, numAffected) {
            console.log(err);

            var newUnregisteredUser = new UnregisteredUser({ name: req.body.inputs[0], email: req.body.inputs[3], event: record._id });

            newUnregisteredUser.save(function (err, record2, numAffected) {
                console.log(err);
                console.log(record2);

                eventUserRecord.findByIdAndUpdate(record._id, { unregisteredUser: record2._id }, { new: true }, function (err, doc) {
                    console.log(err);

                    res.send([record2.name, doc.signIn, doc.signOut, record2.email, doc._id]);
                });
            });
        });
    },

    //allows an admin to update when an user signed in or out
    updateUser: function (req, res) {
        var sDate = new Date(req.body.inputs[0]);
        var eDate = new Date(req.body.inputs[1]);
        eventUserRecord.findByIdAndUpdate(req.body.id, { signIn: sDate, signOut: eDate }, { new: true }, function (err, doc) {
            console.log(err);
            console.log(doc);

            res.send([doc.signIn, doc.signOut]);
        });
    },

    changeProfilePic: function (req, res) {
        uploadImage(req, res).then(function (imageId) {
            if (imageId == null) {
                res.end();
                console.log('profile pic upload failed');
                return;
            }

            User.findByIdAndUpdate(req.user._id, { profilePic: imageId }, { new: true }, function (err, doc) {
                console.log(err);
                console.log(doc);

                res.end();
            });
        });
    },

    //This method returns information about a particular user that only other members can see
    getUserInfo: function (req, res) {

        //check if requesting user has access
        Organization.findOne({ nickname: req.params.id }, function (err, org) {
            if (err == null) {
                if (org != null) {
                    User.findById(req.params.userId).populate('memberOrganizationAssociation', null, { organization: org._id }).exec(function (err, user) {

                        //This checks if the user is a member of the organization
                        var memberinOrganization = org.members.some(function (value) {
                            return value.equals(user._id);
                        });

                        //member is not in organization if this runs
                        if (!memberinOrganization) {
                            console.log(user._id + " is not in " + org._id);
                            res.end();
                            return;
                        }

                        var isMemberAdmin = org.admins.some(function (value) {
                            return value.equals(user._id);
                        });

                        console.log(user);

                        if (isMemberAdmin) {
                            //member is an admin
                            res.json({ first: user.first_name, last: user.last_name, email: user.email, hours: user.memberOrganizationAssociation[0].hours, status: 1 });
                        } else {
                            //member is not an admin
                            res.json({ first: user.first_name, last: user.last_name, email: user.email, status: 0 });
                        }
                    });
                } else {
                    console.log('getUserInfo org is null');
                    res.end();
                }
            } else {
                console.log('getUserInfo error: ' + err);
                res.end();
            }
        });
    },

    getEventInfo: function (req, res) {
        Event.findById(req.params.id, function (err, event) {
            if (err == null) {
                if (event != null) {

                    var output = {
                        name: event.name,
                        startDate: event.startDate.toString(),
                        endDate: event.endDate.toString(),
                    };

                    if (event.location) {
                        output.location = event.location.address;
                    }

                    if (event.description) {
                        output.description = event.description;
                    }

                    if (event.eventPhoto) {
                        output.photo = true;
                    } else {
                        output.photo = false;
                    }

                    res.json(output);
                } else {
                    console.log("getEventInfo event is null");
                    res.end();
                }
            } else {
                console.log('getEventInfo error: ' + err);
                res.end();
            }
        });
    },

    //add check to verify that calling user has permission
    getEventViewInfo: function (req, res) {
        //verify that req.body.id is of an objectId form
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log('getEventViewInfo: ' + req.params.id + ' is not a valid objectID form');
            res.end();
            return;
        }

        eventUserRecord.find({ parentEvent: req.params.id }).select('user unregisteredUser signIn signOut _id').populate('user').exec(function (err, docs) {
            if (err === null) {
                if (docs !== null) {
                    res.json(docs);
                } else {
                    console.log('getEventViewInfo: no documents were returned');
                    res.end();
                }
            } else {
                console.log('getEventViewInfo error: ' + err);
                res.end();
            }
        });
    },

    getOrgSettingsInfo: function (req, res) {
        Organization.findOne({ nickname: req.params.id }, function (err, org) {
            if (err === null) {
                if (org !== null) {
                    res.json({ name: org.name, nickname: org.nickname, individualServiceGoal: org.individualServiceGoal, OrganizationServiceGoal: org.OrganizationServiceGoal, serviceEmail: org.serviceEmail, summary: org.summary });
                } else {
                    console.log('getOrgSettingsInfo org is null');
                    res.end();
                }
            } else {
                console.log('getOrgSettingsInfo error: ' + err);
                res.end();
            }
        });
    },

    //This function is called by an admin and it changes a member to an admin, an admin to a member
    //or kicks out an admin/member
    //TODO: better error handling
    changeUserStatus: function (req, res) {

        //First check that calling user is an admin
        Organization.findOne({ nickname: req.params.id }, function (err, org) {

            //Make sure that there is not an error
            if (!err) {

                //Make sure that the org is not null
                if (org) {

                    //make sure the calling user is an admin
                    var isMemberAdmin = org.admins.some(function (value) {
                        return value.equals(req.user._id);
                    });

                    if (isMemberAdmin) {

                        if (!mongoose.Types.ObjectId.isValid(req.body.user_id)) {
                            console.log("changeUserStatus: given user id is not valid");
                            res.status(400).end();
                            return;
                        }

                        //This is the option to remove member
                        if (req.body.selectedOption === "0") {
                            //a check to make sure that the last member cannot remove themselves.
                            if (org.members.length <= 1) {
                                res.status(200).end();
                                return;
                            }
                            Organization.findByIdAndUpdate(org._id, { $pull: { admins: mongoose.Types.ObjectId(req.body.user_id), members: mongoose.Types.ObjectId(req.body.user_id) } }, function (err, updatedOrg) {

                                if (!err) {
                                    User.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.user_id), { $pull: { adminOf: org._id, memberOf: org._id } }, function (err, updatedUser) {

                                        if (err) {
                                            console.log("changeUserStatus user update error: " + err);
                                            res.status(500).end();
                                        } else {
                                            res.status(200).send("OK");
                                        }
                                    });
                                } else {
                                    console.log("changeUserStatus org update error: " + err);
                                    res.status(500).end();
                                }
                            });
                        } else if (req.body.selectedOption === "1") { //This is the option to make admin
                            Organization.findByIdAndUpdate(org._id, { $push: { admins: mongoose.Types.ObjectId(req.body.user_id) } }, function (err, updatedOrg) {

                                if (!err) {
                                    User.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.user_id), { $push: { adminOf: org._id } }, function (err, updatedUser) {

                                        if (err) {
                                            console.log("changeUserStatus user update error: " + err);
                                            res.status(500).end();
                                        } else {
                                            res.status(200).send("OK");

                                        }
                                    });
                                } else {
                                    console.log("changeUserStatus org update error: " + err);
                                    res.status(500).end();
                                }
                            });
                        } else if (req.body.selectedOption === "2") { //This is the option to make member
                            //This makes sure that last admin cannot make himself a member
                            if (org.admins.length <= 1) {
                                res.status(200).end();
                                return;
                            }

                            Organization.findByIdAndUpdate(org._id, { $pull: { admins: mongoose.Types.ObjectId(req.body.user_id) } }, function (err, updatedOrg) {

                                if (!err) {
                                    User.findByIdAndUpdate(mongoose.Types.ObjectId(req.body.user_id), { $pull: { adminOf: org._id } }, function (err, updatedUser) {

                                        if (err) {
                                            console.log("changeUserStatus user update error: " + err);
                                            res.status(500).end();
                                        } else {
                                            res.status(200).send("OK");
                                        }
                                    });
                                } else {
                                    console.log("changeUserStatus org update error: " + err);
                                    res.status(500).end();
                                }
                            });
                        } else {
                            console.log("changeUserStatus selectedOption is not valid");
                            res.status(400).end();
                        }
                    } else {
                        console.log('changeUserStatus: calling user is not admin');
                        res.status(400).end();
                    }
                } else {
                    console.log('changeUserStatus: org is null');
                    res.status(400).end();
                }
            } else {
                console.log('changeUserStatus error: ' + err);
                res.status(500).end();
            }
        });
    },

    //This methods returns the profile picture of an user
    getProfilePic: function (req, res) {

        //check that the req.params.id supplied is an actual objectId
        console.log(mongoose.Types.ObjectId.isValid(req.params.id));
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log('getProfilePic invalid id supplied');
            res.end();
            return;
        }

        if (req.params.id == req.user._id) {
            if (req.user.profilePic == null || req.user.profilePic == undefined) {
                res.end();
                console.log('no profile pic for req.user');
            } else {
                retrieveProfilePic(req, res, req.user.profilePic);
            }
        } else {
            User.findById(mongoose.Types.ObjectId(req.params.id), function (err, user) {
                if (err == null) {
                    if (user != null) {
                        if (!(req.user.profilePic == null || req.user.profilePic == undefined)) {
                            retrieveProfilePic(user.profilePic);
                        } else {
                            res.end();
                            console.log('getProfilePic no user pic found');
                        }
                    } else {
                        console.log('getProfilePic user not found');
                    }
                } else {
                    console.log('getProfilePic err: ' + err);
                    res.end();
                }
            });
        }
    },

    changeOrganizationImage: function (req, res) {
        //verify that user is an admin
        Organization.findOne({ nickname: req.params.id }).populate('admins').exec(function (err, organization) {
            var isMemberAdmin = organization.admins.some(function (value) {
                return value._id.equals(req.user.id);
            });

            //if user is not an admin, do not go any further
            if (!isMemberAdmin) {
                console.log('requesting user is not an admin');
                res.end();
                return;
            }

            //upload the image to the database, then add the id to the organization record
            uploadImage(req, res).then(function (imageId) {
                if (imageId == null) {
                    res.end();
                    console.log('upload organization image failed');
                    return;
                }

                Organization.findByIdAndUpdate(organization._id, { organizationImage: imageId }, { new: true }, function (err, doc) {
                    if (err != null) {
                        console.log('error updating organization image');
                        console.log('err: ' + err);
                        console.log('doc: ' + doc);

                        res.end();
                        return;
                    }

                    res.end();
                });
            });
        });
    },

    getOrganizationImage: function (req, res) {
        retrieveOrganizationImage(req, res);
    },

    changeEventImage: function (req, res) {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log('changeEventImage invalid id supplied');
            res.end();
            return;
        }

        //verify that user is an admin
        Organization.findOne({ events: { $all: req.params.id } }).populate('admins').exec(function (err, organization) {

            if (err != null) {
                res.end();
                console.log('changeEventImage error: ' + err);
                return;
            }

            if (organization == null) {
                res.end();
                console.log('changeEventImage organization is null');
                return;
            }

            var isMemberAdmin = organization.admins.some(function (value) {
                return value._id.equals(req.user.id);
            });

            //if user is not an admin, do not go any further
            if (!isMemberAdmin) {
                console.log('requesting user is not an admin');
                res.end();
                return;
            }

            //upload the image to the database, then add the id to the organization record
            uploadImage(req, res).then(function (imageId) {
                if (imageId == null) {
                    res.end();
                    console.log('upload Event image failed');
                    return;
                }

                Event.findByIdAndUpdate(req.params.id, { eventPhoto: imageId }, { new: true }, function (err, doc) {
                    if (err != null) {
                        console.log('error updating Event image');
                        console.log('err: ' + err);
                        console.log('doc: ' + doc);

                        res.end();
                        return;
                    }

                    res.end();
                });
            });
        });
    },

    //check if requesting user is able to make changes
    eventEdit: function (req, res) {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log('eventEdit invalid id supplied');
            res.end();
            return;
        }

        var updateThing = { name: req.body.name, description: req.body.description, startDate: req.body.startDate, endDate: req.body.endDate };


        if (req.body.address) {
            updateThing.location = { type: 'Point', coordinates: [req.body.lat, req.body.lng], address: req.body.address };
        }

        Event.findByIdAndUpdate(req.params.id, updateThing, function (err, event) {
            if (err != null) {
                console.log('eventEdit error: ' + err);
            }
            res.end();
        });
    },

    getEventImage: function (req, res) {
        retrieveEventImage(req, res);
    },

    setLocation: function (req, res) {
        User.findByIdAndUpdate(req.user._id, { homeLocation: { type: 'Point', coordinates: [req.body.lat, req.body.lng], address: req.body.address } }, function (err, user) {
            if (err == null) {
                res.sendStatus(200);
            } else {
                console.log("setLocation error: " + err);
                res.sendStatus(500);
            }
        });
    },

    changeOrganizationName: function (req, res) {
        Organization.findOneAndUpdate({ nickname: req.params.id }, { name: req.body.name }, function (err, org) {
            if (err == null) {
                res.redirect('/organization/' + org.nickname + '/');
            } else {
                console.log('changeOrganizationName error: ' + err);
                res.end();
            }
        });
    },

    changeOrganizationNickname: function (req, res) {
        Organization.findOneAndUpdate({ nickname: req.params.id }, { nickname: req.body.nickname }, function (err, org) {
            if (err == null) {
                res.redirect('/organization/' + org.nickname + '/');
            } else {
                console.log('changeOrganizationNickname error: ' + err);
                res.end();
            }
        });
    },

    changeOrganizationSummary: function (req, res) {
        Organization.findOneAndUpdate({ nickname: req.params.id }, { summary: req.body.summary }, function (err, org) {
            if (err == null) {
                res.redirect('/organization/' + org.nickname + "/");
            } else {
                console.log('changeOrganizationSummary error: ' + err);
                res.end();
            }
        });
    },

    changeIndividualGoalHours: function (req, res) {
        Organization.findOneAndUpdate({ nickname: req.params.id }, { individualServiceGoal: req.body.individualGoal }, function (err, org) {
            if (err == null) {
                res.redirect('/organization/' + org.nickname + '/');
            } else {
                console.log('changeOrganizationNickname error: ' + err);
                res.end();
            }
        });
    },

    changeOrganizationGoalHours: function (req, res) {
        Organization.findOneAndUpdate({ nickname: req.params.id }, { OrganizationServiceGoal: req.body.organizationGoal }, function (err, org) {
            if (err == null) {
                res.redirect('/organization/' + org.nickname + '/');
            } else {
                console.log('changeOrganizationNickname error: ' + err);
                res.end();
            }
        });
    },

    changeJoinOption: function (req, res) {
        console.log(req.params);

        if (!(req.params.value !== 'true' || req.params.value !== 'false')) {
            console.log('changeJoinOption: incorrect value supplied');
            res.end();
            return;
        }

        var joinValue;
        if (req.params.value === "true") {
            joinValue = true;
        } else {
            joinValue = false;
        }

        Organization.findOneAndUpdate({ nickname: req.params.id }, { applyToJoin: joinValue }, function (err, doc) {
            if (err == null) {
                if (doc != null) {
                    res.end();
                } else {
                    console.log('changeJoinOption: no org found');
                    res.end();
                }
            } else {
                console.log('changeJoinOption error: ' + err);
                res.end();
            }
        });
    },

    eventDetailEdit: function (req, res) {
        if (!mongoose.Types.ObjectId.isValid(req.body.user)) {
            console.log('eventEdit invalid id supplied');
            res.end();
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(req.body.event)) {
            console.log('eventEdit invalid id supplied');
            res.end();
            return;
        }

        var update = {};

        if (req.body.signIn) {
            update.signIn = req.body.signIn;
        } else if (req.body.signOut) {
            update.signOut = req.body.signOut;
        } else {
            console.log("eventDetailEdit: neither signIn nor signOut data available");
            res.end();
            return;
        }

        eventUserRecord.findOneAndUpdate({ parentEvent: mongoose.Types.ObjectId(req.body.event), user: mongoose.Types.ObjectId(req.body.user) }, update, function (err, doc) {
            if (err != null) {
                console.log('eventDetailEdit update error: ' + err);
                res.end();
            } else {
                res.end();
            }
        });
    },

    getApplications: function (req, res) {
        Organization.findOne({ nickname: req.params.id }).populate('waitingUsers').exec(function (err, org) {
            if (err == null) {
                if (org != null) {
                    res.send(org);
                } else {
                    console.log('getApplications: org is null');
                    res.end();
                }
            } else {
                console.log('getApplications error: ' + err);
                res.end();
            }
        });
    },

    allowMember: function (req, res) {
        Organization.findOneAndUpdate({ nickname: req.params.id }, { $addToSet: { members: req.user._id } }, { new: true }, function (err, org) {
            if (err == null) {
                if (org != null) {
                    var newMemberOrganizationAssociation = new MemberInOrganizationSchema({ user: req.user._id, organization: org._id, hours: 0 });
                    newMemberOrganizationAssociation.save(function (err, newDoc, numAffected) {
                        if (err == null) {
                            User.findByIdAndUpdate(req.user._id, { $addToSet: { memberOf: org._id, memberOrganizationAssociation: newDoc._id } }, { new: true }, function (err2, user) {
                                if (err2 == null) {
                                    res.end();
                                } else {
                                    console.log("joinUser error: " + err2);
                                    res.end();
                                }
                            });
                        } else {
                            console.log("joinUser error : " + err);
                            res.end();
                        }
                    });
                } else {
                    console.log('joinUser org is null');
                    res.end();
                }
            } else {
                console.log('joinUser error: ' + err);
                res.end();
            }
        });
    }
};

function uploadImage(req, res) {
    return new Promise(function (resolve, reject) {
        if (req.files.length > 0) {
            var db = mongoose.connection;

            var readStream = fs.createReadStream(req.files[0].path);

            var bucket = new mongodb.GridFSBucket(db.db);
            var uploadStream = bucket.openUploadStream(req.files[0].originalName);

            uploadStream.once('finish', function () {
                //console.log('upload image success: ' + uploadStream.id);
                fs.unlink(req.files[0].path, function (err) {
                    if (err) {
                        console.log("uploadImage error: " + err);
                    }
                });
                resolve(uploadStream.id);
            });

            uploadStream.once('error', function (err) {
                console.log('upload image error: ' + err);
            });

            readStream.pipe(uploadStream);
        } else {
            resolve(null);
        }
    });
}

function createEventId() {
    var milliseconds = (new Date().getTime() % 1000000);

    var random = Math.floor(Math.random() * 10000);

    var id = random.toString() + "-" + milliseconds.toString();

    return id;
}


function filterPublicEvents(value) {
    return value.public;
}

function retrieveProfilePic(req, res, id) {

    var db = mongoose.connection;
    var bucket = new mongodb.GridFSBucket(db.db);
    var downloadStream = bucket.openDownloadStream(id);

    /* current unnecessary code
    downloadStream.once('end', function(){
        console.log('end');
    });
    */

    downloadStream.once('error', function (error) {
        console.log(error);
    });

    downloadStream.pipe(res);
}

//this function gets the single image associated with an organization
function retrieveOrganizationImage(req, res) {
    var db = mongoose.connection;

    var bucket = new mongodb.GridFSBucket(db.db);

    Organization.findOne({ nickname: req.params.id }, function (err, organization) {
        if (organization === null) {
            res.end();
            //console.log('retrieveOrganizationImage: organization could not be found');
            return;
        }

        if (organization.organizationImage === undefined) {
            res.end();
            //console.log('retrieveOrganizationImage: organization image cannot be found or does not exist');
            return;
        }



        var downloadStream = bucket.openDownloadStream(organization.organizationImage);

        downloadStream.once('error', function (error) {
            console.log('retrieveOrganizationImage Error:' + error);
            res.end();
        });

        downloadStream.pipe(res);
    });
}

//this function gets the single image associated with an event
function retrieveEventImage(req, res) {
    var db = mongoose.connection;

    var bucket = new mongodb.GridFSBucket(db.db);

    Event.findById(req.params.id, function (err, event) {
        if (event == null) {
            res.end();
            console.log('retrieveEventImage: event could not be found');
            return;
        }

        if (event.eventPhoto == null) {
            res.end();
            console.log('retrieveEventImage: event image cannot be found or does not exist');
            return;
        }

        var downloadStream = bucket.openDownloadStream(event.eventPhoto);

        downloadStream.once('error', function (error) {
            console.log('retrieveEventImage: error opening event image: ' + error);
        });

        downloadStream.pipe(res);
    });
}