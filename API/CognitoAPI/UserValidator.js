//Insert required JS here
var request = require('request');
var stringformat = require('sprintf-js');
var jwtDecode = require('jwt-decode');
var User = require('../../Objects/UserObject');

/**
 * UserValidator constructor
 * @param Strategy the UserStrategy configured
 *
 * @constructor
 */
function UserValidator(Strategy){
    /**
     * Middleware that will authenticate a user with a username and password
     * @param req HTTP request, req.body should contain user info
     * @param res HTTP response, will return AccessToken and RefreshToken if authenticated
     * @param next Calls next middleware, used for errors
     */
    this.authenticate = function(req,res,next){
        var CognitoIdentityServiceProvider = Strategy;

        var authenticationData = {
            Username : req.body.username,
            Password : req.body.password
        };
        var authenticationDetails = new CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
        var poolData = {
            UserPoolId : req.app.get('DatabaseConfig').SecurityConfig.poolID,
            ClientId : req.app.get('DatabaseConfig').SecurityConfig.clientID
        };
        var userPool = new CognitoIdentityServiceProvider.CognitoUserPool(poolData);
        var userData = {
            Username : req.body.username,
            Pool : userPool
        };
        var cognitoUser = new CognitoIdentityServiceProvider.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                var Tokens = {
                    AccessToken:result.accessToken.jwtToken,
                    RefreshToken:result.refreshToken.token
                };
                res.end(JSON.stringify(Tokens));
            },
            onFailure: function (err) {
                var error = new Error(req.app.get('Locale')('msg.loginfailed'));
                error.status = 401;
                next(error);
            },
            newPasswordRequired:function(err){
                var error = new Error(req.app.get('Locale')('msg.newpasswordneeded'));
                error.status = 400;
                next(error);
            }
        });

    };
    /**
     * Middleware function that will use the accessToken to fetch a user in the database and converts it into a
     * user object that will be treated throughout the request
     * @param req HTTP request, req.user and  will be added if the token is valid
     * @param res HTTP response, should be used
     * @param next Calls the next middleware whether the user is connected or not
     */
    this.loadSession = function(req,res,next){
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
        if(req.headers.hasOwnProperty("authorization")){
            var accessToken = req.headers.authorization.split(" ")[1];
            var params = {
                AccessToken:accessToken
            };
            Strategy.getUser(params, function (err, data) {
                if(data) {
                    var refreshToken;
                    if(req.headers.hasOwnProperty("refreshtoken")){
                        refreshToken = req.headers.refreshtoken.split(" ")[1];
                        res.header("RefreshToken", req.headers.refreshtoken.split(" ")[1]);
                    }
                    var expiration = ((jwtDecode(accessToken).exp*1000) - new Date().getTime());
                    req.user = new User(accessToken,refreshToken,data.Username,expiration,data.UserAttributes,req.app.get('CustomConfig'));

                    if(req.user.hasOwnProperty(req.app.get('CustomConfig').UserConfig.StoreIntegrationData)){
                        var userStoreID = req.user[req.app.get('CustomConfig').UserConfig.StoreIntegrationData].split(':')[1];
                        req.user.StoreName =storeNameList.value[userStoreID];
                    }

                    res.header("AccessToken", accessToken);

                    if(req.app.get('CustomConfig').AppConfig.LoginWorkaround){
                        var getBearerLink = req.app.get('CustomConfig').AppConfig.LoginBaseURL+'API/TrustTokens/Sessions?token=%s&provider=%s';
                        request(stringformat.vsprintf(getBearerLink,[req.user['accessToken'],'4']),function(error,response,body){
                            console.log('getting bearer');
                            req.user["bearerToken"] = JSON.parse(body)["BearerToken"];
                            next();
                        });
                    }else{
                        req.user['bearerToken']=accessToken;
                        next();
                    }

                }else if (err){
                    res.status(401);
                    next();
                }

            });
        }else{
            next();
        }

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
            var options = req.app.get('permission') || {};
            var Unauthorized = options.redirectUnauthorized || {status: 401, redirect: '/'};
            var Unauthenticated = options.redirectUnauthenticated || {status: 403, redirect: '/'};
            //checks if the user is logged in at least
            if (!req.isAuthenticated()){
                res.render('login', { title: req.app.get('CustomConfig').ClientConfig.title,Locale:req.app.get('Locale')});
                /**
                 //the user is not authenticated
                 res.status(Unauthenticated.status);
                 if(req.method === 'GET') {
                    res.redirect(Unauthenticated.redirect);
                }
                 if(req.method === 'PUT' || req.method === 'POST') {
                    res.end('You are not logged in or have timed out. You will be redirected to the login page');
                }
                 */
            } else {
                var params = {
                    AccessToken: req.user['accessToken']
                };
                if (req.user.CheckRoles(roles)) {
                    if (!req.user.expiration || req.user.expiration <= 300000) {
                        console.log('refreshingToken');
                        if(req.user.hasOwnProperty("refreshToken")){
                            refreshToken(next);
                        }
                    } else {
                        next();
                    }
                } else {
                    res.status(Unauthorized.status);
                    if(req.method === 'PUT' || req.method === 'POST') {
                        res.end(req.app.get('Locale')('msg.accessdenied'));
                    }
                    if(req.method === 'GET') {
                        res.redirect(Unauthorized.redirect);
                    }
                }
            }

            function refreshToken(next) {
                var params = {
                    AuthFlow: 'REFRESH_TOKEN_AUTH',
                    ClientId: req.app.get('DatabaseConfig').SecurityConfig.clientID,
                    AuthParameters:{
                        "USERNAME"  : req.user.username,
                        "REFRESH_TOKEN":req.user.refreshToken
                    }
                };
                Strategy.initiateAuth(params,function(err,data){
                    if(err){
                        console.log(err, err.stack)
                    }else{
                        req.user.accessToken = data.AuthenticationResult.AccessToken;
                        res.header("AccessToken", data.AuthenticationResult.AccessToken);
                        next();
                    }
                });
            }

        };
    };
    /**
     * Middleware that logs the connected user from every application, essencially, it invalidates all AccessTokens
     * @param req express request
     * @param res express response
     * @param next calls next middleware function
     */
    this.globalLogout = function(req,res,next){
        if(req.isAuthenticated()){
            var params = {
                AccessToken: req.user.accessToken
            };
            Strategy.globalSignOut(params, function(err, data) {

                if (err) console.log(err, err.stack); // an error occurred
                else     next();           // successful response
            });
        }else{
            res.redirect('/');
        }

    };
    /**
     * Middleware that will register a new user, it will also validate the request body
     * @param req express request req.body should contain the form submitted by the user
     * @param res express response
     * @param next calls the next router function Used only if "ValidateNewUsersEmail" is false
     */
    this.register = function (req,res,next){
        var userAttributes = [];
        for(var field in req.body){
            if(req.body.hasOwnProperty(field) && field !=="username"&&field !== "password"){
                userAttributes.push({Name:field,Value:req.body[field]});
            }
        }
        var params = {
            ClientId: req.app.get('DatabaseConfig').SecurityConfig.clientID, /* required */
            Password: req.body.password,
            Username: req.body.username,
            UserAttributes: userAttributes
        };
        Strategy.signUp(params,function(err,data){
            if (err){
                next(err);
            }else{
                //if configured, a user will be automatically validated and authenticated. If not, they will be redirected to a validation page
                if(req.app.get('CustomConfig').AppConfig.ValidateNewUsersEmail){
                    var username = (req.body.username||req.body.email);
                    var StyleContext = (req.query.styleContext)? '&styleContext='+req.query.styleContext:'';
                    var redirectURL = (req.query.redirectURL)? '&redirectURL='+req.query.redirectURL:'';
                    var responseObject = {
                        redirectURL:('/register/validate?username='+username+StyleContext+redirectURL),
                        responseMessage:req.app.get('Locale')('msg.validationmailsent')
                    };
                    res.end(JSON.stringify(responseObject))
                }else{
                    params = {
                        UserPoolId: req.app.get('DatabaseConfig').SecurityConfig.poolID,
                        Username: req.body.username
                    };
                    Strategy.adminConfirmSignUp(params, function(err, data) {
                        if (err) {
                            next(err);
                        }else{
                            params = {
                                UserAttributes: [
                                    {
                                        Name: 'email_verified',
                                        Value: 'true'
                                    }
                                ],
                                UserPoolId: req.app.get('DatabaseConfig').SecurityConfig.poolID,
                                Username: req.body.username
                            };
                            Strategy.adminUpdateUserAttributes(params,function(err,data){
                                if (err) {
                                    next(err);
                                }else{
                                    next();
                                }
                            });
                        }
                    });
                }

            }
        });
    };
    /**
     * Middleware that will recieve a validation Code and a username to confirm the users account in the database
     * thus allowing them to connect(if configured, the function can be bypassed)
     * @param req express request, req.body will contail submitted info
     * @param res express response, returns to the user
     * @param next calls the next router function, mostly used to send errors to the error handler
     */
    this.validateUser = function (req,res,next){
        var params = {
        ClientId: req.app.get('DatabaseConfig').SecurityConfig.clientID,
        Username: req.body.username,
        ConfirmationCode:req.body.confirmation
    };
        Strategy.confirmSignUp(params,function(err,data){
            if (err) {
                next(err)
            }else{
                var StyleContext = (req.query.styleContext)? 'styleContext='+req.query.styleContext:'';
                var redirectURL = (req.query.redirectURL)? '&redirectURL='+req.query.redirectURL:'';
                var responseObject = {
                    redirectURL:('/login?'+StyleContext+redirectURL),
                    responseMessage:"Your account is now confirmed"
                };
                //res.end(JSON.stringify(responseObject))
                next();
            }
        });

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
        var params = {
            ClientId: req.app.get('DatabaseConfig').SecurityConfig.clientID,
            Username: (req.body.username||req.body.email)
        };
        Strategy.forgotPassword(params, function(err, data) {
            if (err) console.log(err, err.stack);
            else     console.log(data);
            //the response will be unknown to the user, they will always be redirected to a validation page
        });
        var StyleContext = (req.query.styleContext)? '&styleContext='+req.query.styleContext:'';
        var redirectURL = (req.query.redirectURL)? '&redirectURL='+req.query.redirectURL:'';
        var responseObject = {
            redirectURL:('/forgotpassword/validate?username='+(req.body.username||req.body.email)+StyleContext+redirectURL),
            responseMessage:req.app.get('Locale')('msg.validationmailsent')
        };
        res.end(JSON.stringify(responseObject));


    };
    /**
     * Middleware that will validate a users code and change their password
     * @param req express request, req.body contains user submitted info
     * @param res express response,
     * @param next calls the next router function
     */
    this.validateForgotPassword = function(req,res,next){
        var params = {
            ClientId: req.app.get('DatabaseConfig').SecurityConfig.clientID,
            ConfirmationCode: req.body.confirmation,
            Password: req.body.password,
            Username: (req.body.username||req.body.email)
        };
        Strategy.confirmForgotPassword(params, function(err, data) {
            if (err) {
                next(err);
            } else {
                if(req.app.get('CustomConfig').AppConfig.ConnectUserAfterForgotPassword){
                    req.body.username = req.body.username || req.body.email;//this is because passport only reads the "username" in the req body
                    next();//calls the next middlware which would be passport
                }else{
                    res.end(req.app.get('Locale')('msg.passwordresetsuccess'));
                }
            }

        });
    }
}

module.exports = UserValidator;