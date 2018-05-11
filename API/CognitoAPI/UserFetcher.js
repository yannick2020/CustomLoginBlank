var User = require('../../Objects/UserObject');
/**
 * API containing various functions for user fetching and editing
 *
 * @constructor
 */
function UserFetcher(Strategy){
    /**
     * Fetch the user in the database using their username and adds the fetched used in the request as userFetched
     * @param req HTTP request
     * @param res HTTP response
     * @param next callback
     * @param uname
     */
    this.FetchUser = function (req,res,next,uname) {
        //console.log("seach by email");
        var roleKey = req.app.get('permission').role;
        var ISPrefix = req.app.get('CustomConfig').UserConfig.UserIdPrefix;
        uname = uname.replace(ISPrefix,'');
        if(uname=== req.user.username || uname=== req.user.email) {
            next();
        }
        else{
            var params = {
                UserPoolId: req.app.get('DatabaseConfig').SecurityConfig.poolID,
                Username: uname
            };
            Strategy.adminGetUser(params, function (err, data) {
                if (err) {
                    console.log(uname);
                    var error = new Error(req.app.get('Locale')('msg.getuserfailed'));
                    error.status = err.statusCode;
                    next(error)
                    //user not fount error
                } else {
                    var storeNameList = {};
                    req.app.get('storeIntegration').map(function(config){
                        if(config.hasOwnProperty("name")&&config.name==="storeDescriptionList"){
                            storeNameList.name=config.name;
                            storeNameList.value = {};
                            config.value.map(function(store){
                                storeNameList.value[store.name] = store.value;
                            });
                        }
                    });
                    req['userFetched'] = new User("","",data.Username,0,data.UserAttributes,req.app.get('CustomConfig'));
                    if(req['userFetched'].hasOwnProperty(req.app.get('CustomConfig').UserConfig.StoreIntegrationData)){
                        var userStoreID = req['userFetched'][req.app.get('CustomConfig').UserConfig.StoreIntegrationData].split(':')[1];
                        req['userFetched'].StoreName =storeNameList.value[userStoreID];
                    }


                    next();
                }
            });
        }
    };
    /**
     * Edit a user in the database. Ignores all fields the user can not edit.
     * @param req HTTP request req.userFetched contains the user to edit
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
            UserPoolId: req.app.get('DatabaseConfig').SecurityConfig.poolID, /* required */
            Username: req.userFetched.username, /* required */
            UserAttributes: UserAttributes
        };
        Strategy.adminUpdateUserAttributes(params, function (err, data) {
            if (err) {
                var error = new Error(req.app.get('Locale')('msg.updateuserfailed'));
                error.status = 500;
                next(error);
            }
            else {
                res.end(req.app.get('Locale')('msg.updateusersuccess'));
            }
        });
    };
    /**
     * Will fetch all the user in the cognito user pool set up in the config file
     * @param app express application, contains userPool information and various settings
     * @param callback returns array of User objects containing every user in DB
     */
    this.GetAllUsers = function(app,callback){
        var AllUsers =[];
        var params = {
            UserPoolId: app.get('DatabaseConfig').SecurityConfig.poolID,
            Limit:0
        };
        console.log('fetching Users...');
        function cognitoCallback(err,data){
            if (err || data.Users[0] == null) {
                console.log(err);
            }else{
                //Simply adds all the users in the request to be treated in another middleware
                AllUsers = AllUsers.concat(data.Users.map(function(user){
                    var UserFetched = new User("","",user.Username,0,user.Attributes,app.get('CustomConfig'));
                    UserFetched.UserStatus = user.UserStatus;
                    return UserFetched;
                }));
                if(data.PaginationToken){
                    var params = {
                        UserPoolId: app.get('DatabaseConfig').SecurityConfig.poolID,
                        Limit:0,
                        PaginationToken:data.PaginationToken
                    };
                    Strategy.listUsers(params, cognitoCallback);
                }else{
                    console.log("All users fetched");
                    callback(AllUsers);
                }

            }
        }
        Strategy.listUsers(params, cognitoCallback);

    };
    /**
     * Will delete another user in the database.
     * @param req HTTP request req.userFetched contains the user to delete
     * @param res HTTP response
     * @param next callback
     */
    this.DeleteUser = function(req,res,next){
        var params = {
            UserPoolId: req.app.get('DatabaseConfig').SecurityConfig.poolID, /* required */
            Username: req.userFetched.username /* required */
        };
        Strategy.adminDeleteUser(params,function(err,data){
            if (err) {
                var error = new Error(req.app.get('Locale')('msg.deleteuserfailed'));
                error.status = 500;
                next(error);
            }
            else {
                res.end(req.app.get('Locale')('msg.deleteusersuccess'));
            }
        });
        res.end();
    };
}

module.exports =UserFetcher;