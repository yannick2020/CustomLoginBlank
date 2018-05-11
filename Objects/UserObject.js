/**
 * User Module
 * @module User
 * @copyright 20-20 Technologies Inc. All rights reserved.
 */

/**
 *
 * Constructor for application user.
 * @param {string} accessToken Access Token to fetch the user
 * @param {string} refreshToken Refresh Token to refresh the users AccessToken
 * @param {string} username Unique user name
 * @param {number}expiration how much time until the accesstoken expires
 * @param {object} profile the rest users profile as an object, should be formatted like so {roleKey:"Role1,Role2",AttributeName:"AttributeValue"..}
 * @param {object}config json config file;
 * @param {array} profile the rest users profile as an array, should be formatted like so {Name:roleKey,Value:"Role1,Role2"},{Name:"AttributeName",Value:"AttributeValue"}..
 * @constructor
 */
function User(accessToken,refreshToken,username,expiration,profile,config){
    //
    //Private variables
    //
    var roleKey = config.UserConfig.RoleAttributeName;
    var DisplayName = config.UserConfig.UserDisplayName;
    var ProfileProperties = [];//only used to send to IdealSpaces Not used in application
    var configuredFields = config.UserConfig.ProfileAttributes;
    //
    //Public variables
    //
    this.accessToken =accessToken;
    this.refreshToken = refreshToken;
    this.expiration = expiration;
    this.username = username;
    this[roleKey] = undefined;
    if(profile && !Array.isArray(profile)) {//if the profile is a single object
        for (key in profile) {
            if (profile.hasOwnProperty(key) && !this[key]) {
                if(key !==roleKey){
                    this[key] = profile[key];
                    ProfileProperties.push({Name:key,Value:profile[key]})
                }else{
                    this[key] = (profile[key]||"").split(',');
                }
            }
        }
    }else if (Array.isArray(profile)){
        //if the profile is an array of objects
        for (var i = 0; i < profile.length; i++) {
            //lets take out the values to keep this clean
            var indicators = Object.keys(profile[i]);
            var key = profile[i][indicators[0]];
            //Let's first make sure the user has the attribute in the first place
            if (!this[key]) {
                if(key !==roleKey){
                    this[key] = profile[i][indicators[1]];
                    ProfileProperties.push({Name:key,Value:profile[i][indicators[1]]})
                }else{
                    this[roleKey] = (profile[i][indicators[1]]||"").split(',') ;
                }
            }
        }
    }
    if(!this[roleKey]){
        //if no roles are present in the profile, the roles will be an empty array
        this[roleKey] = [];
    }
    if(!this["preferred_username"]){
        //This configures the name that is shown in IdealSpaces welcome message, if a field "preferred_username" already exists in the user Profile, this will be ignored
        ProfileProperties.push({Name:"preferred_username",Value:this[DisplayName]})
    }
    //places empty values in fields that have not been written in
    for(i =0;i<configuredFields.length;i++){
        if(!this[configuredFields[i]]){
            this[configuredFields[i]] = "";
        }
    }
    /**
     * Creates a sessionDTO of the user to IdealSpaces
     * @returns SessionDTO{{BearerToken: *, Provider: number, ReturnCode: number, Roles: *, TimeStamp: string, Token: *, TokenExpiration: *, UserId: *}}
     *
     * @param state IS state to prevent attack
     */
    this.MakeSessionDTO = function(state){
        return {
            BearerToken:this.accessToken,
            Provider:0,
            ReturnCode:0,
            Roles:this[roleKey],
            TimeStamp:('/Date('+new Date().getTime()+')/'),
            Token:this.accessToken,
            TokenExpiration:this.expiration,
            UserId:this.GetIdealSpacesId(),
            "CustomData":state
        };
    };
    /**
     *
     * @param {string}state IS state to prevent attack
     * @returns UserDTO{{Email: *, FullName: *, IsApproved: boolean, IsLockedOut: boolean, ProfileProperties: *, Provider: number, Roles: *, UserId: *, UserName: *|readUsername}}
     *
     */
    this.MakeUserDTO = function(state){
        return {
            "Email":(this.email||this.Email),
            "FullName":this[DisplayName],
            "IsApproved":true,
            "IsLockedOut":false,
            "ProfileProperties":ProfileProperties,
            "Provider":4,
            "Roles":this[roleKey],
            "UserId":this.GetIdealSpacesId(),
            "UserName":this.username,
            "CustomData":state

        };
    };
    /**
     * Function that checks if a user has at least 1 of the roles specified in the roles array
     * @param roles an array of roles, if empty, will return true
     * @returns {boolean} if the user has access
     */
    this.CheckRoles = function(roles){
        var authorized = false;
        var userRoles = this[roleKey];
        if(roles){
            authorized = (roles.length === 0 || roles.some(function(role) {
                return userRoles.indexOf(role) > -1;
            }));
        }else{
            authorized = true;
        }
        return authorized;
    };


    /**todo bugs cant take certain actions
     * Determines if a user can make an action on a/every parameter
     * @param {string}actionConfig From the config file, should be either "FieldsRolesConfig" or "UserInteractionRoles" but can be anything if foncigures correctly
     * @param {array}parameters The parameter(s) to make an action on, Should be a user role or a user profile field.
     * @param {string}action action to take
     * @param lenient if true, will allow even if the action is not configured
     * @return {boolean} if the user is allowed
     */
    this.UserCanTakeAction = function(actionConfig,parameters,action,lenient){
        var permissionConfig = config[actionConfig];
        var canTakeAction = true;
            for(var i=0;i<parameters.length && canTakeAction;i++){
                //if the parameter exists in the config file and is configured,check if the user has access, if not, return false
                if(permissionConfig[parameters[i]]) {
                    var roles = permissionConfig[parameters[i]][action];
                    if (roles) {
                        if (roles.length !== 0) {
                            canTakeAction = this.CheckRoles(roles);
                        }
                    }
                }else{
                    canTakeAction = !!permissionConfig.IsLenient;
                }
            }

        return canTakeAction;
    };

    /**
     * Checks if the user has Access to a Request in the config file PermissionConfig
     * @param {string}Request the request the user makes (i.e. "ViewAccount")
     * @return {boolean}hasAccess
     */
    this.HasPermission = function(Request){
        var hasAccess = false;
        if(config.PermissionConfig[Request]){
            hasAccess = this.CheckRoles(config.PermissionConfig[Request]);
        }
        return hasAccess;
    };

    /**
     * Gets the array of the user roles using the RoleAttributeName in the config file
     * @return {array}List of user roles
     */
    this.GetRoles = function(){
        return (this[roleKey]||[]);
    };
    /**
     * Gets the users IdealSpaces id.
     * @return {string} The Users IdealSpaces Id matching. used to find projects.
     * @constructor
     */
    this.GetIdealSpacesId = function(){
        return config.UserConfig.UserIdPrefix+this.username;
    };
    /**
     * Gets the users store ID
     * @return {string} the users store ID
     */
    this.GetStoreID = function(){
        var id = '000';
        var StoreIntegration = config.UserConfig.StoreIntegrationData;
        if(this[StoreIntegration]){
            id = this[StoreIntegration];
            if(id.includes(':')){
                id = id.split(':')[1]
            }
            for(;id.length<3;){
                id = '0'+id;
            }
        }
        return id;
    };

    /**
     * Returns the users display name for welcome message. Set in UserConfig in configuration file
     * @return {string} the users display name.
     */
    this.GetDisplayName = function(){
      return this[DisplayName];
    };
}


module.exports = User;