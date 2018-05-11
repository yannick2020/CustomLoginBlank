var User = require('../../Objects/UserObject');
/**
 * API containing various functions for user fetching and editing
 * @memberOf module:BlankAPI
 * @constructor
 */
function UserFetcher(Strategy){
    /**
     * Fetch the user in the database using their username and adds the fetched used in the request as userFetched
     * @param req HTTP request
     * @param res HTTP response
     * @param next callback
     * @param username
     */
    this.FetchUser = function(req,res,next,username){
        var profile = {
            property:"Value"
        };
        req.userFetched = new User("","",username,0,profile,req.app.get('CustomConfig'));
        next();
    };
    /**
     * Edit a user in the database
     * @param req HTTP request
     * @param res HTTP response
     * @param next callback
     */
    this.EditProfile = function(req,res,next){
        res.end()
    };
    /**
     * Will fetch all the user in the database set up in the config file
     * @param app express application, contains security config information and various settings
     * @param callback returns array of User objects containing every user in DB
     */
    this.GetAllUsers = function(app,callback){
        callback([]);
    };
    /**
     * Will delete another user in the database.
     * @param req HTTP request req.userFetched contains the user to delete
     * @param res HTTP response
     * @param next
     * @constructor
     */
    this.DeleteUser = function(req,res,next){
        res.end();
    };
}

module.exports =UserFetcher;