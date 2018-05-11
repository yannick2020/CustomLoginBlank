var AWS = require('aws-sdk');
var CognitoSDK = require('amazon-cognito-identity-js-node');

/**
 * Configure the cognito user service
 * @param config the security configurations in config file
 * @return {object}configured user service provider
 *
 * @constructor
 */
function CognitoStrategy(config){
    AWS.config.update({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region
    });
    var CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    CognitoIdentityServiceProvider.AuthenticationDetails = CognitoSDK.AuthenticationDetails;
    CognitoIdentityServiceProvider.CognitoUserPool = CognitoSDK.CognitoUserPool;
    CognitoIdentityServiceProvider.CognitoUser = CognitoSDK.CognitoUser;
    return CognitoIdentityServiceProvider;
}

module.exports = CognitoStrategy;