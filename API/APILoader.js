var FilePath = "BlankAPI";
/**
 * API Module
 * @module API
 * @copyright 20-20 Technologies Inc. All rights reserved.
 */
/**
 * Load Api.
 * This is a blank API that does nothing and should only be used to have an idea of what functions are called or as a starting point for writing custom API. To view examples, refer to CognitoAPI
 * @param FilePath API Directory
 * @param SecurityConfig (config.json).DatabaseConfig.SecurityConfig
 * @constructor
 */
function APILoader(FilePath,SecurityConfig){
    FilePath = FilePath||"BlankAPI";
    try {
        var Strategy = (require('./'+FilePath + '/Strategy.js'))(SecurityConfig);
        this.FrontEndToBackEnd = new (require('./'+FilePath + '/FrontEndToBackEnd.js'))(Strategy);
        this.UserFetcher = new (require('./'+FilePath + '/UserFetcher.js'))(Strategy);
        this.UserSelfManager = new (require('./'+FilePath + '/UserSelfManager.js'))(Strategy);
        this.UserValidator = new (require('./'+FilePath + '/UserValidator.js'))(Strategy);
    }catch(e){
        console.log("Failed to load API");
        console.log(e.stack);
        throw e;
    }
}

/**
 * Initialie configure directories and return new APILoader
 * @param config loaded config.json file
 */
function Initialize(config){
    FilePath = config.FilePathsConfig.APIDirectory;
    return new APILoader(config.DatabaseConfig.SecurityConfig);

}

module.exports = APILoader;