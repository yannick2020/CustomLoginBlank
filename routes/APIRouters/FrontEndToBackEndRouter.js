var express = require('express');
/**
 * Cognito Router, This router should handle any http requests made by the front end. only safe metheods should be used here
 * @module FrontEndToBackEnd
 * @copyright 20-20 Technologies Inc. All rights reserved.
 */
/**
 * Configures middleware functions and returns router.
 * @param API - API.FrontEndToBackEnd object.
 * @param API.FindUsers - FindUsers function configured in API.
 * @param API.GetRoles - GetRoles function configured in API.
 * @param API.GetStores - GetStores function configured in API.
 * @return {object}Express router
 */
function LoadRouter(API){
    var router = express.Router();
    router.post('/FindUsers',
        API.FindUsers,
        function(req,res,next){
            var results = {
                Users:[]
            };
            for(var i=0;i<req.SearchResults.Users.length;i++) {
                if(req.user.UserCanTakeAction("UserInteractionRoles",req.SearchResults.Users[i].GetRoles(),"CanFind")){
                    results.Users.push(req.SearchResults.Users[i]);
                }
            }

            if(req.SearchResults.PaginationToken){
                res.header("PaginationToken",req.SearchResults.PaginationToken);
            }
            res.render('userSearchResults',{Results:results,Locale:req.app.get('Locale')});
        }
    );
    router.use('/GetRoles', API.GetRoles);
    router.use('/GetStores', API.GetStores);

    return router;
}


module.exports = LoadRouter;