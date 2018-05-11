/**
 * Cognito Middleware Router, This router will call verious functions from the cognitoidentityservice and store the needed response in the request
 */
var express = require('express');
var User = require('../../Objects/UserObject');

/**
 * Router setup
 */

/**
 * Configures middleware functions and returns router.
 * @param API API.FrontEndToBackEnd object.
 * @return {object}Express router
 */
function LoadRouter(API){
    var router = express.Router();
    router.param('uname', API.FetchUser);
    router.get(['/profile','/profile/:uname'],function (req,res,next){
        if(!req['userFetched']){
            res.redirect('/myprofile');
        }else {
            if (req.user.UserCanTakeAction("UserInteractionRoles",req['userFetched'].GetRoles(),"CanFind")) {
                next();
            } else {
                var err = new Error(req.app.get('Locale')('msg.cannotviewuser'));
                err.status = 403;
                next(err);
            }
        }
    });
    router.get(['/edit/:uname','/edit'],function (req,res,next){
        if(!req['userFetched']){
            res.redirect('/myprofile/editprofile');
        }else {
            if (req.user.UserCanTakeAction("UserInteractionRoles",req['userFetched'].GetRoles(),"CanEditOthers")) {
                next();
            } else {
                var err = new Error(req.app.get('Locale')('msg.cannotmodifyuser'));
                err.status = 403;
                next(err);
            }
        }
    });
    router.put('/edit/:uname',
        function(req,res,next){
            if(!req['userFetched']){
                res.redirect('/myprofile/editprofile');
            }else {
                if (req.user.UserCanTakeAction("UserInteractionRoles",req['userFetched'].GetRoles(),"CanEditOthers")) {
                    next();
                } else {
                    var err = new Error(req.app.get('Locale')('msg.cannotmodifyuser'));
                    err.status = 403;
                    next(err);
                }
            }
        },
        function(req,res,next){
            var roleKey = req.app.get('permission').role;
            var mandatoryFields = req.app.get('DatabaseConfig').mandatoryFields;
            var validParams = true;
            if(req.body.hasOwnProperty(roleKey)) {
                var queryRoles = (req.body[roleKey])?req.body[roleKey].split(','):[];
                var userRoles = req.userFetched[roleKey]||[];
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
                var err;
                validParams = req.user.UserCanTakeAction("UserInteractionRoles",modifiedRoles,"CanEditOthers");
                if(!validParams){
                    err = new Error(req.app.get('Locale')('msg.updaterolefailed'));
                    err.status = 400;
                    next(err);
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
                    if(!validParams){
                        err = new Error(req.app.get('Locale')('msg.invalidfields')+emptyMandatory.toString());
                        err.status = 400;
                        next(err);
                    }
                }
            }
            if(validParams) {
                next()
            }
        },
        API.EditProfile);
    router.delete('/edit/:uname',
        function(req,res,next){
            if(!req['userFetched']){
                res.redirect('/myprofile/editprofile');
            }else {
                if (req.user.UserCanTakeAction("UserInteractionRoles",req['userFetched'].GetRoles(),"CanDeleteOthers")) {
                    next();
                } else {
                    var err = new Error('Forbidden');
                    err.status = 403;
                    next(err);
                }
            }
        },API.DeleteUser);
    router.get('/projects/:uname',function(req,res,next){
        if(!req['userFetched']){
            res.redirect('/myprofile/myprojects');
        }else {
            next();
        }
    });
    return router;
}

module.exports = LoadRouter;