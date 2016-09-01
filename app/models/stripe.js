var Organization = require('mongoose').model('Organization');
var MemberInOrganizationSchema = require('mongoose').model('MemberOrganizationAssociation');
var randomstring = require('randomstring');
var request = require('request');

module.exports = {
    connectStripe : function(req, res){
        //check if requesting is an admin of organization
        Organization.findOne({nickname : req.params.id}, function(err, org){
            if(!err){
                if(org !== null){
                    var isMemberAdmin = org.admins.some(function (value) {
                        return value.equals(req.user._id);
                    });

                    if(!isMemberAdmin){
                        //console.log("stripeConnect: requesting user is not an admin");
                        res.end();
                        return;
                    }

                    var state = randomstring.generate(20);
                    state = state + (new Date().getTime());

                    //might add time stamp later
                    MemberInOrganizationSchema.findOneAndUpdate({organization : org._id, user : req.user._id}, {stripeAccount : {state : state}}, function(err, updatedRecord){
                        if(!err){
                            if(updatedRecord){
                                res.redirect('https://connect.stripe.com/oauth/authorize?response_type=code&scope=read_write&client_id=ca_95rnm5Va7cshdm7Ve1ESD4nLfGnid9lt&state=' + state);
                            }else{
                                //console.log("stripeConnect updatedRecord is null");
                                res.end();
                            }
                        }else{
                            //console.log("stripeConnect Error: " + err);
                            res.end();
                        }
                    });
        
                        
                }else{
                    //console.log("stripeConnect: org does not exist");
                    res.end();
                }
            }else{
                console.log("stripeConnect error: " + err);
                res.end();
            }
        });
    },

    stripeCallBack : function(req, res){
        //check state with database
        if(req.query.state && req.query.code && !req.query.error){
            MemberInOrganizationSchema.findOne({stripeAccount : {state : req.query.state}}, function(err, memberInOrganization){
                if(!err){
                    if(memberInOrganization){
                        if(req.user._id.equals(memberInOrganization.user)){
                            request.post({url :'https://connect.stripe.com/oauth/token',
                                form:{
                                    grant_type: "authorization_code",
                                    client_id: "ca_95rnm5Va7cshdm7Ve1ESD4nLfGnid9lt",
                                    code : req.query.code,
                                    client_secret : "sk_test_PSeJlNoAjX9zHfJbDgN1cjyc"
                                    }
                                }, function(err, r, body){
                                    if(!err){
                                        //not sure if this check is necessary
                                        if(body){
                                            MemberInOrganizationSchema.findOneAndUpdate({stripeAccount : {state : req.query.state}}, {stripeAccount : body}, function(err, updatedMemberInOrganization){
                                                if(!err){
                                                    if(updatedMemberInOrganization){
                                                        Organization.findByIdAndUpdate(updatedMemberInOrganization.organization, {stripeAccount : updatedMemberInOrganization._id}, function(err, updatedOrganization){
                                                            if(!err){
                                                                if(updatedOrganization){
                                                                    res.redirect('/');
                                                                }else{
                                                                    console.log("stripeCallBack organization is null");
                                                                    res.end();
                                                                }
                                                            }else{
                                                                console.log("stripeCallBack Error: " + err);
                                                                res.end();
                                                            }
                                                        });
                                                    }else{
                                                        console.log("stripeCallBack updatedMemberInOrganization is null");
                                                        res.end();
                                                    }
                                                }else{
                                                    console.log("stripeCallBack Error: " + err);
                                                    res.end();
                                                }
                                            });
                                        }else{
                                            console.log("stripeCallBack body is null");
                                            res.end();
                                        }
                                    }else{
                                        console.log("stripeCallBack error: " + err);
                                        res.end();
                                    }
                                });
                        }else{
                            console.log("stripeCallBack : user ids do not match");
                            res.end();
                        }
                    }else{
                        console.log("stripeCallBack memberInOrganization does not exist");
                        res.end();
                    }
                }else{
                    console.log("stripeCallBack Error: " + err);
                    res.end();
                }
            });
        }else{
            //delete state number in database
            if(!req.query.error){
                console.log("stripeCallBack : state and/or code not provided");
            }else{
                console.log("stripeCallBack Query Error : " + req.query.error);
            }           
            res.end();
        }

        //res.redirect('/');
        
    }
};