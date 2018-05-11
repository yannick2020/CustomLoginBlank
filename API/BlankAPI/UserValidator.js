//Insert required JS here

/**
 * UserValidator constructor
 * @param Strategy the UserStrategy configured
 * @module BlankAPI
 * @constructor
 */
function UserValidator(Strategy){
    /**
     * Middleware that will authenticate a user with a username and password
     * This is only used to simulate a login via login page
     * @param req HTTP request, req.body should contain user info
     * @param res HTTP response, will return AccessToken and RefreshToken if authenticated
     * @param next Calls next middleware, used for errors
     */
    this.authenticate = function (req,res,next){
        res.end();
    };
    /**
     * Middleware function that will use the accessToken to fetch a user in the database and converts it into a
     * user object that will be treated throughout the request
     * @param req HTTP request, req.user and  will be added if the token is valid
     * @param res HTTP response, should be used
     * @param next Calls the next middleware whether the user is connected or not
     */
    this.loadSession = function(req,res,next){
        res.end();
    };
    /**
     *  Middleware function to be called in every page that the user needs to be logged in to view
     *  This function will verify:
     *      1: if the accessToken can fetch and return a user from the database
     *          -if return an error, destroy the session to avoid conflicts, the user will have to relog and create a new session
     *      2: if the user is the same as the user stored in the session
     *          -if different, update the session to match the database info
     *      3: If the user is allowed to access this page with the roles they have.
     *          -redirect to front page if unauthorized or send http error which will be handled by front-end
     * @param roles - the roles of which the user needs to have to have access to the page
     */
    this.permission  =  function (roles) {
        var self = this;
        return function (req, res, next) {
            res.end();
        };
    };
    /**
     * Middleware that logs the connected user from every application, essencially, it invalidates all AccessTokens
     * @param req express request
     * @param res express response
     * @param next calls next middleware function
     */
    this.globalLogout =  function(req,res,next){
        res.end();
    };
    /**
     * Middleware that will register a new user, it will also validate the request body
     * @param req express request req.body should contain the form submitted by the user
     * @param res express response
     * @param next calls the next router function Used only if "ValidateNewUsersEmail" is false
     */
    this.register = function (req,res,next){
        res.end();

    };
    /**
     * Middleware that will recieve a validation Code and a username to confirm the users account in the database
     * thus allowing them to connect(if configured, the function can be bypassed)
     * @param req express request, req.body will contail submitted info
     * @param res express response, returns to the user
     * @param next calls the next router function, mostly used to send errors to the error handler
     */
    this.validateUser = function (req,res,next){
        res.end();

    };
    /**
     * Middleware function that will send a validation code to a users email or SMS
     * It will automatically redirect to a validation page without sending errors if they occur to
     * protect privacy
     * @param req express request, req.body shoudl contain user inforation
     * @param res express response, under normal circumstances, should redirect to a validation page
     * @param next calls the next router function if available
     */
    this.forgotPassword = function (req,res,next){
        res.end();
    };
    /**
     * Middleware that will validate a users code and change their password
     * @param req express request, req.body contains user submitted info
     * @param res express response,
     * @param next calls the next router function
     */
    this.validateForgotPassword = function (req,res,next){
        res.end();
    };
}

module.exports = UserValidator;