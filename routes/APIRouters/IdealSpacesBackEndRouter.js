var express = require('express');
var router = express.Router();
//todo validate app key

/* Makes a Session DTO for all calls made by IS. */
function LoadRouter(API){
    var router = express.Router();
    router.use( function(req, res, next) {
        console.log("Called by IdealSpaces!");
        if (req.method ==="DELETE")
            console.log(req.headers);
        next();
    });
    router.get('/BearerTokens/Sessions',function(req,res,next){
        res.send(req.user.MakeSessionDTO(req.query.state));

    });
    router.param('ISID',API.FetchUser);
    router.get('/Users/:ISID/Profiles',function(req,res,next){
        if(!req['userFetched']){
            res.send(req.user.MakeUserDTO(req.query.state));
        }else {
            if (req.user.UserCanTakeAction("UserInteractionRoles",req['userFetched'].GetRoles(),"CanFind")) {
                res.send(req['userFetched'].MakeUserDTO(req.query.state));
            } else {
                res.status(403);
                res.end();
            }
        }
    });
    router.post('/Users/:ISID/Profiles',function(req,res,next){
        if(!req['userFetched']){
            res.send(req.user.MakeUserDTO(req.query.state));
        }else {
            if (req.user.UserCanTakeAction("UserInteractionRoles",req['userFetched'].GetRoles(),"CanFind")) {
                res.send(req['userFetched'].MakeUserDTO(req.query.state));
            } else {
                res.status(403);
                res.end();
            }
        }
    });
    return router;
}

module.exports = LoadRouter;
