/**
 * Cognito Router, This router should handle modifications to a user's own profile using their accessToken
 */
var express = require('express');
var request = require('request');

function LoadRouter(API){
    var router = express.Router();
    router.put('/editprofile',
        function(req,res,next){
            var roleKey = req.app.get('permission').role;
            var UserAttributes = [];
            var mandatoryFields = req.app.get('DatabaseConfig').mandatoryFields;
            var validParams = true;
            if(req.body.hasOwnProperty(roleKey)) {
                var queryRoles = req.body[roleKey].split(',');
                var userRoles = req.user[roleKey];
                var modifiedRoles = [];
                for(var i=0;i<queryRoles.length;i++){
                    if(userRoles.indexOf(queryRoles[i])===-1){
                        modifiedRoles.push(queryRoles[i]);
                    }
                }
                for(var j=0;j<userRoles.length;j++){
                    if(queryRoles.indexOf(userRoles[j])===-1){
                        modifiedRoles.push(userRoles[j]);
                    }
                }
                console.log(modifiedRoles);
                validParams = req.user.UserCanTakeAction("UserInteractionRoles",modifiedRoles,"CanEditSelf");
                if(!validParams){
                    //todo error handling
                    res.end(req.app.get('Locale')('msg.updaterolefailed'));
                }else{
                    var emptyMandatory = [];
                    for(var mandatoryField in mandatoryFields) {
                        if (mandatoryFields.hasOwnProperty(mandatoryField)) {
                            if (req.body.hasOwnProperty(mandatoryField) && req.body[mandatoryField] === "") {
                                emptyMandatory.push(mandatoryField);
                                validParams = false;
                            }
                        }
                    }
                    emptyMandatory = emptyMandatory.map(function (field) {
                        return req.app.get('Locale')('lbl.'+field);
                    });
                    if(!validParams){
                        var error = new Error(req.app.get('Locale')('msg.invalidfields')+emptyMandatory.toString());
                        error.status = 400;
                        next(error);
                    }
                }
            }

            if(validParams) {
                next()
            }
        },
        API.EditProfile,
        function(req,res,next){
            var StoreIntegration =req.app.get('CustomConfig').UserConfig.StoreIntegrationData;
            if(!req.user.HasPermission("ProjectsStayInStore")&&(req.body[StoreIntegration] !== req.user[StoreIntegration])){
                console.log('now im gonna update the users stores secrely');
                var options ={
                    method:'GET',
                    url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL+'API/Users/'+req.user.GetIdealSpacesId()+'/Projects?role=ProjectOwner',
                    headers: {
                        'Authorization': 'Bearer ' + req.user['bearerToken'],
                        'content-type': 'application/json'
                    }
                };
                request(options,function(err, response, body){
                    if(!err){
                        if(response && response.statusCode ===200){
                            try{
                                var projects = JSON.parse(body);
                                console.log(projects.length);
                                var newStore = req.body[StoreIntegration].split(':')[1];
                                projects.forEach(function(project){
                                    if(project.hasOwnProperty("IntegrationData")){
                                        var Integration = project.IntegrationData.replace(/storeID":"?(\d*)"?/,function(match,p1,offset,string){
                                            console.log(p1);
                                            var regex = new RegExp('"?'+p1+'"?');
                                            return match.replace(regex,'"'+newStore+'"');
                                        });
                                        var options ={
                                            method:'POST',
                                            url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL+'API/Projects/'+project.Id,
                                            headers: {
                                                'Authorization': 'Bearer ' + req.user['bearerToken'],
                                                'content-type': 'application/json'
                                            },
                                            body:JSON.stringify({project:{"IntegrationData":Integration}})
                                        };
                                        console.log(Integration);
                                        request(options,function(err,response,body){
                                            if(!err) {
                                                if (response && response.statusCode === 200) {
                                                }else{
                                                    try{
                                                        var error = new Error(JSON.parse(body)['Message']);
                                                        console.log(error);
                                                    }catch(e){
                                                        console.log(e);
                                                    }
                                                }
                                            }else{
                                                console.log(err);
                                            }
                                        });
                                    }
                                });
                            }catch(e){
                                console.log(e);
                            }
                        }else{
                            try{
                                var error = new Error(JSON.parse(body)['Message']);
                                console.log(error);
                            }catch(e){
                                console.log(e);
                            }
                        }
                    }else{
                        console.log(err);
                    }
                });
            }

        });
    router.delete('/editprofile',
        function(req,res,next){
            if (req.user.UserCanTakeAction("UserInteractionRoles",req.user.GetRoles(),"CanDeleteSelf")) {
                next();
            } else {
                var err = new Error(req.app.get('Locale')('msg.cannotdeleteself'));
                err.status = 401;
                next(err);
            }
        },
        API.DeleteSelf);
    return router;
}

module.exports = LoadRouter;