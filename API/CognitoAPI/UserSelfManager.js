

/**
 * Constructor for the self manager.
 *
 * @constructor
 */
function UserSelfManager(Strategy){
    /**
     * Edits the users profile. Manages permissions and validates fields.
     * @param req HTTP request req.body contains the new users profile
     * @param res HTTP response
     * @param next callback
     */
    this.EditProfile = function(req,res,next){
        var UserAttributes = [];
        for (var field in req.body) {
            if (req.body.hasOwnProperty(field) && req.user.UserCanTakeAction("FieldRolesConfig",[field],"EditOthers")) {
                if (req.body.hasOwnProperty(field)) {
                    UserAttributes.push({Name: field, Value: req.body[field]});
                }
            }
        }
        var params = {
            AccessToken: req.user.accessToken,
            UserAttributes: UserAttributes
        };
        Strategy.updateUserAttributes(params, function (err, data) {

            if (err) {
                next(err);
            }
            else {
                res.end(req.app.get('Locale')('msg.updateusersuccess'));
                next();
            }
        });
    };
    /**
     * Deletes the connected users profile
     * @param req HTTP request req.user contains the user information including tokens
     * @param res HTTP response
     * @param next callback next(new Error()) can be used for error handling
     * @constructor
     */
    this.DeleteSelf = function(req,res,next){
        var params = {
            AccessToken: req.user.accessToken
        };
        Strategy.deleteUser(params, function (err, data) {
            if (err) {
                next(err);
            }
            else {
                res.end(req.app.get('Locale')('msg.deleteusersuccess'));
            }
        });
    };
}

module.exports = UserSelfManager;