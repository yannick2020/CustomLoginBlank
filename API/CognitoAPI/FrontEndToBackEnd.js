var StoreFinder = require('./StoreFinderHandler');
var User = require('../../Objects/UserObject');
/**
 * FrontEndToBackEnd API object
 *
 * @constructor
 */
function FrontEndToBackEnd(Strategy){
    /**
     * Middleware function that finds a user with a query given in post
     * @param req HTTP request req.body contains request body
     * @param res HTTP response send results in response body as json object.
     * @param next callback function
     * @constructor
     */
    this.FindUsers = function (req, res,next) {
        //console.log("seach by email");
        var filterKey = (req.body.userInfo.includes('@'))?'email':'preferred_username';
        if(/.{8}-.{4}-.{4}-.{4}-.{12}/.test(req.body.userInfo)){
            filterKey='sub'
        }
        //todo this doesnt work when there are 3000+ users
        var params = {
            UserPoolId: req.app.get('DatabaseConfig').SecurityConfig.poolID,
            Limit:0,
            PaginationToken:req.body.PaginationToken,
            Filter:filterKey+"^=\""+req.body.userInfo+"\""
        };
        Strategy.listUsers(params, function (err, data) {
            if (err || data.Users[0] == null) {
                var error = new Error(req.app.get('Locale')('msg.finduserfailed'));
                error.status = 400;
                next(error);
            } else {
                var list=[];
                data.Users = data.Users.map(function(user){
                    var UserFetched = new User("","",user.Username,0,user.Attributes,req.app.get('CustomConfig'));
                    UserFetched.UserStatus = user.UserStatus;
                    return UserFetched;
                });
                var SearchResults ={
                    Users:data.Users
                };
                if(data.PaginationToken){
                    SearchResults["PaginationToken"] =data.PaginationToken;
                }
                req.SearchResults = SearchResults;
                next();
            }
        });
    };
    /**
     * Middleware function that sends a list of roles to be displayed in frontend.
     * Not used for permission handling but it is still good practice to only display roles user has access to.
     * @param req HTTP request
     * @param res HTTP response. send roles as a json array
     * @constructor
     */
    this.GetRoles = function(req,res){
        var rolesArray = [];
        for(var i=0;i<req.app.get('CustomConfig').ClientConfig.rolesList.length;i++){
            if(req.user.UserCanTakeAction("UserInteractionRoles",[req.app.get('CustomConfig').ClientConfig.rolesList[i]],"CanEditOthers")){
                rolesArray.push(req.app.get('CustomConfig').ClientConfig.rolesList[i]);
            }
        }
        res.end(JSON.stringify(rolesArray));
    };
    /**
     * Middleware function that finds a store or stores with a user zipcode
     * @param req HTTP request
     * @param res HTTP response send store list as a json array of objects
     * @param next callback function
     * @constructor
     */
    this.GetStores = function(req,res,next){

        if(req.body.zipcode){
            StoreFinder.FindStore(req,{
                onSuccess:function (response) {
                    res.send(response);
                },
                onFailure:function (err) {
                    var error = new Error(req.app.get('Locale')('msg.nostoresfound'));
                    error.status = err.status;
                    next(error)
                }
            });
        }else{
            res.end(req.app.get('Locale')('msg.nozipcode'));
        }

    };
}

module.exports = FrontEndToBackEnd;