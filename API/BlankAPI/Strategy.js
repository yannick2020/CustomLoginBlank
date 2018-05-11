

/**
 * Configures and returns the stategy
 * @param config the security configurations in config file
 * @return {object}configured strategy
 */
function ConfigureStrategy(config){
    return new UserStrategy(config);
}

/**
 * Configures user strategy used throut the application to get and manage users in the database
 * @param config DatabaseConfig.SecurityConfig section in config file
 * @module BlankAPI
 * @constructor
 */
function UserStrategy(config){
    var SecurityInfo = config.SecurityInfo;

    this.getUser = function(params,callback){
        callback(null,null);
    };
    this.listUsers = function(params,callback){
        callback(null,null);
    };
    this.initiateAuth = function(params,callback){
        callback(null,null);
    };
    this.globalSignOut = function(params,callback){
        callback(null,null);
    };
    this.signUp = function(params,callback){
        callback(null,null);
    };
    this.confirmSignUp = function(params,callback){
        callback(null,null);
    };
    this.forgotPassword = function(params,callback){
        callback(null,null);
    };
    this.updateUserAttributes = function(params,callback){
        callback(null,null);
    };
    this.adminConfirmSignUp = function(params,callback){
        callback(null,null);
    };
    this.adminUpdateUserAttributes = function(params,callback){
        callback(null,null);
    };
    this.adminGetUser = function(params,callback){
        callback(null,null);
    };

}
module.exports = ConfigureStrategy;