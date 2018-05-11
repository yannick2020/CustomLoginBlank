#Login Console
Notes: 
- The SSL keys in `bin/sslcert` are not valid certificates and are only used when testing locally in https.
- There is a config files as examples. `config.json` though the app can't work using it, it is used as a template

##Table of contents

- [Setup](#1.-setup)
- [Configuration](#2.-configuration)
- [API Requirements](#3.-api-requirements)
- [Creating API](#4.-creating-api)

## 1. Setup
The folder `C:/tmp` needs to exist

    1.Download an extract repository
    2.Run command npm install in root (must have node installed) https://nodejs.org/en/
    3.run command npm start in root
## 2. Configuration
In the project root, there is a [config.json](./config.json) file. It can be modified to change how the application works.
###Config file objects
- [AppConfig](#appconfig)
    - [debug](#debug)
    - [CacheAllUsersOnStartup](#cacheallusersonstartup)
    - [ProxyMode](#proxymode)
    - [LoginStub](#loginstub)
    - [LoginWorkaround](#loginworkaround)
    - [ValidateNewUsersEmail](#validatenewusersemail)
    - [ConnectUserAfterForgotPassword](#connectuserafterforgotpassword)
    - [IdealSpacesURL](#idealspacesurl)
    - [ProjectThumbnailsURL](#projectthumbnailsurl)
- [UserConfig](#userconfig)
    - [RoleAttributeName](#roleattributename)
    - [StoreIntegrationData](#storeintegrationdata)
    - [UserDisplayName](#userdisplayname)
    - [UserIdPrefix](#useridprefix)
- [DatabaseConfig](#databaseconfig)
    - [SecurityConfig](#securityconfig)
    - [mandatoryFields](#mandatoryfields)
- [FilePathsConfig](#filepathsconfig)
    - [APIDirectory](#APIDirectory)
- [ClientConfig](#clientconfig)
    - [title](#title)
    - [language](#language)
    - [rolesList](#roleslist)
    - [RegistrationFormFields](#registrationformfields)
    - [StyleContexts](#stylecontexts)
- [PermissionConfig](#permissionconfig)
    - [ViewAccount](#viewaccount)
    - [ModifyAccount](#modifyaccount)
    - [ViewMyProjects](#viewmyprojects)
    - [SearchUser](#searchuser)
    - [SearchProject](#searchproject)
    - [ViewStoresStatistics](#viewstoresstatistics)
    - [ViewUsers](#viewusers)
    - [EditUsers](#editusers)
    - [SearchAllStores](#searchallstores)
    - [ViewOthersProjects](#viewothersprojects)
- [FieldRolesConfig](#fieldrolesconfig)
    - [IsLenient](#islenient)
    - [FieldName](#fieldname)
        - [ViewSelf](#viewself)
        - [ViewOthers](#viewothers)
        - [EditSelf](#editself)
        - [EditOthers](#editothers)
- [UserInteractionRoles](#userinteractionroles)
    - [IsLenient](#islenient)
    - [RoleName](#rolename)
        - [CanFind](#canfind)
        - [CanEditSelf](#caneditself)
        - [CanEditOthers](#caneditothers)
        - [CanDeleteSelf](#candeleteself)
        - [CanDeleteOthers](#candeleteothers)

### AppConfig
#### debug
Determine if the application is in debug or not, currently not used
#### CacheAllUsersOnStartup
If true, the application will use a listUsers method from the DBStrategy to fetch every user in the database and store them in cache. Used to make statistics gathering faster when dealing with many users
#### ProxyMode
If true, the application will disable all routes except IdealSpacesBackEndRouter. Only IdealSpaces will communicate with this application. Used if client already has a ligin of their own
#### LoginStub
If true, even if the application is in proxy mode, Login/Registration will still be accesible. Used to simulate a Client's login page for Proxy mode
#### LoginWorkaround
If true, the app will fetch a BearerToken from IdealSpaces currently configured login interface and use it to make calls to IdealSpaces. Used when login extenstion configuration is not accesible
#### ValidateNewUsersEmail
If true, When users are registered, they will have to validate their emails using a confirmation code send via email, if false, they will be connected upon registration. Used when database requires email verification but needs to be bypassed
#### ConnectUserAfterForgotPassword
If true, a user who forgot their password will be automatically connected when they reset their password. Used to make login flow quicker
#### IdealSpacesURL
Url to the IdealSpaces application this is linked to. Used to fetch user projects
#### ProjectThumbnailsURL
Url to the location project thumbnails are stores. Used to display project thumbnails
### UserConfig
#### RoleAttributeName
The attribute in the user profile used to determine roles.
#### StoreIntegrationData
The attribute in the user profile used to determine their associated store
#### UserDisplayName
The Display name the user will have in IdealSpaces welcome message and application frontpage
#### UserIdPrefix
The prefix added to a user's username when sent as a UserDTO and SessionDTO to IdealSpaces
### DatabaseConfig
#### SecurityConfig
Security Details used to access database or API
#### mandatoryFields
Fields required for user registration or account modification. Unly checks if fields are empty
### FilePathsConfig
The following are paths to Express Routers
#### APIDirectory
The directory name of the API used in the application. API are located in `root/API`
### ClientConfig
#### title
Html Title tag in the application
#### language
Language of the application, Uses `Locals/countryCode.js` to localize the application
#### rolesList
List of all the roles in the app, only used for displaying roles in front-end. Not used for permission handling. Should still be coherent with [UserInteractionRoles](#userinteractionroles)
#### RegistrationFormFields
All the fields in registration form.
#### StyleContexts
Prefix to add in a template file when ``?styleContext=value`` is present in login URL. IdealSpaces uses for ``?styleContext=ids`` when calling login. This allows for custom login form.
### PermissionConfig
Each field contains an array or roles. The user must have at least one of the roles to gain permission.
#### ViewAccount
Permission to view users own profile.
#### ModifyAccount
Permission to modify users own account. Even if a user can modify their account, they may not be able to edit every fields depending on permissions set in [FieldRolesConfig](#fieldrolesconfig).
#### ViewMyProjects
Permission to view users own projects
#### SearchUser
Permission to search other users. Even though a user can search other users they may not be able so view certain users depending on permissions set in [UserInteractionRoles](#userinteractionroles).
#### SearchProject
Permission to search projects in IdealSpaces
#### ViewStoresStatistics
Permission to view store statistics
#### ViewUsers
Permission to view other users. Even though a user can view other users they may not be able so view certain users depending on permissions set in [UserInteractionRoles](#userinteractionroles).
#### EditUsers
Permission to edit other users. Even though a user can modify other users they may not be able so modify certain users depending on permissions set in [UserInteractionRoles](#userinteractionroles) and may also not be able to edit every fields depending on permissions set in [fieldrolesconfig](#fieldrolesconfig).
#### SearchAllStores
Permission to search users or projects in all stores
#### ViewOthersProjects
Permission to view other users projects
### FieldRolesConfig
Determine which actions a user can take on a field value in a profile depending on their roles
#### FieldName
The name of the field. Can be anything. To prevent errors, make sure the field also exists in database
##### ViewSelf
Permission to view the field in the users own profile.
##### ViewOthers
Permission to view the field in another users profile.
##### EditSelf
Permission to edit the field in the users own profile.
##### EditOthers
Permission to edit the field in another users profile.
### UserInteractionRoles
Determines permissions to interact with certain roles. If the application uses roles, make sure these are properly configured, else they may allow security flaws (i.e. ordinary users allowed to grant themselves superadmin or delete another user). If configurations seem unclear, make an issue about it.
#### RoleName
The name of the role the CONNECTED USER will take action on. Can be anything, to prevent errors or potential security flaws, make sure the role is properly written,configured and is used. Each action contains an array of roles. The CONNECTED USER must have AT LEAST ONE of the following roles to make the action on a user that has the role RoleName.
##### CanFind
The roles the CONNECTED USER needs to have at least one of to find ANOTHER USER with the role RoleName.
##### CanEditSelf
The roles the CONNECTED USER needs to have at least one of to edit THEMSELVES. This, though only used once in the app, is a very important configurations. It is used to prevent adding/removing roles a user is not allowed to have/remove.
##### CanEditOthers
The roles the CONNECTED USER needs to have at least one of to edit ANOTHER USER with the role RoleName.
##### CanDeleteSelf
The roles the CONNECTED USER needs to have at least one of to delete themselves. Deleting is currently unsed, but this will prevent a user of a high role(i.e. superadmin) from accidentally deleting themselves
##### CanDeleteOthers
The roles the CONNECTED USER needs to have at least one of to delete ANOTHER USER with the role RoleName.
### IsLenient
If true, a user will be allowed to take an action that is not configured. It is reccomended to be set to false. Defaults to false if not configured.
## 3. API Requirements
This section is to describe which API needs to be configures for the application to work in modes.
###Proxy Mode API
If the app is used in proxy mode, very little API are to be used. It means using the app for the bare minimum of logging into IdealSpaces. The app won't be able to fetch other users,fetch projects, get statistics and other features. For the application to work, assuming login stub is false. The following API and functions needs to be configured.
- [Strategy](#strategy)
- [UserValidator](#uservalidator)
    - [loadSession](#loadsession)

###Proxy Mode with Login Stub API
If the app is used in proxy mode and needs to simulate a login stub for testing, the following API and functions needs to be configured.
- [Strategy](#strategyfunction)
- [UserValidator](#uservalidator)
    - [authenticate](#authenticate)
    - [loadSession](#loadsession)
    
###Full Mode
If the app is not in Proxy Mode or Login Stub. Every feature of the app will be available. The following API and all functions needs to be fully configured.
- [Strategy](#strategy)
- [FrontEndToBackEnd](#frontendtobackend)
- [UserAdminManager](#useradminmanager)
- [UserSelfManager](#userselfmanager)
- [UserValidator](#uservalidator)
- [UserFetcher](#userfetcher)
- [UserHandler](#userhandler)
- [StoreFinderHandler](#storefinderhandler)

## 4. Creating API
This section will explain how to create an API and the functions they wil need for the application. Refer to `API/BlankAPI` for and example of folder tree.

- [Strategy](#strategy)
- [FrontEndToBackEnd](#frontendtobackend)
- [UserFetcher](#userfetcher)
- [UserSelfManager](#userselfmanager)
- [UserValidator](#uservalidator)

### Strategy
This module must export a function that configures and returns a Strategy.
### FrontEndToBackEnd
This API managed user requests made in the front-end to the back-end of the application 
### UserFetcher
This API fetches an other user in the database to view/edit/delete* the user
### UserSelfManager
This API manages the connected user Edit or Delete*
### UserValidator
This API Authenticates,Loads,Permits,Registers,Validates and Update Password.
