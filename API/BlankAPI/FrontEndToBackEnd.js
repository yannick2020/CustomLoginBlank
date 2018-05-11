
/**
 * FrontEndToBackEnd API object
 * @module BlankAPI
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
    this.FindUsers = function(req,res,next){
        var result ={
            Users:[],
            PaginationToken:""//optional will be sent back in req.body for paging when next page is requested
        };
        res.end(JSON.stringify(result));
    };
    /**
     * Middleware function that sends a list of roles to be displayed in frontend, not used for permission handling
     * @param req HTTP request
     * @param res HTTP response. send roles as a json array
     * @param next callback function
     * @constructor
     */
    this.GetRoles = function(req,res,next){
        var roles = [];
        res.end(JSON.stringify(roles));
    };
    /**
     * Middleware function that finds a store or stores with a user zipcode
     * @param req HTTP request
     * @param res HTTP response send store list as a json array of objects
     * @param next callback function
     * @constructor
     */
    this.GetStores = function(req,res,next){
        var StoreList = [
            {
                Name:"",
                Value:""//when selected, this value will be stored a user store
            }
            ];
        res.end(JSON.stringify(StoreList));
    };
}

module.exports = FrontEndToBackEnd;