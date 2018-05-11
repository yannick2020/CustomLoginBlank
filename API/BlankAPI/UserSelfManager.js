

/**
 * Constructor for the self manager.
 * @module BlankAPI
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
        res.end();
    };
}

module.exports = UserSelfManager;