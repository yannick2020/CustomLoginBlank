//App Dependencies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var flash  = require('connect-flash');
var parseXML = require('xml2js').parseString;
var rfs = require('rotating-file-stream');

var CurrtentDate = new Date();
var logDirectory = path.join(__dirname, 'Logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
var stream = rfs('Log.log',{
    interval: '1d', // rotate daily
    path: logDirectory
});
//todo log errors seperately
//View routing Configuration
var index = require('./routes/index');//Inder View Renderer
var users = require('./routes/users');//User View Renderer
var searchuser = require('./routes/searchuser');//Search User View Renderer
var searchproject = require('./routes/searchproject');//Search Project View Renderer
var login = require('./routes/login');//Login View Renderer
var register = require('./routes/register');//Register View Renderer
var forgotPassword = require('./routes/forgotpassword');//Forgot Password View Renderer
var viewprofile = require('./routes/profile');//User Profile View Renderer
var storeStats = require('./routes/storestats');//Store Statistics View Renderer

var queryManager = require('./routes/ISCognitoQueryManager');//Fetched Statistics between IdealSpaces and Cognito


var app = express();

//config files parse
var storeIntegration = {};
parseXML(fs.readFileSync('Integration/Integrationconfig.xml', 'utf8'),function (err,result) {
    if(!err){
        function xmlMapper(value){
            if(!value.hasOwnProperty('var')){
                return{
                    name:value['$'].name,
                    value:value['$'].value
                };
            }else{
                return{
                    name:value['$'].name,
                    value:value.var.map(xmlMapper)
                };
            }
        }
        storeIntegration =result.config.var.map(xmlMapper);
    }
});
//Read config file here
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var Locale = (require('./Objects/Localizer'))(config.ClientConfig.language,config.ClientConfig.customLocale);

var permissionConfig = config.PermissionConfig;

//User DB Routers configuration
var AppAPI = new (require('./API/APILoader'))(config.FilePathsConfig.APIDirectory,config.DatabaseConfig.SecurityConfig);

var UserDBFrontEndToBackEnd = (require('./routes/APIRouters/FrontEndToBackEndRouter'))(AppAPI.FrontEndToBackEnd);//Router to let FrontEnd communicate with backend
var UserSelfManager = (require('./routes/APIRouters/UserSelfManagerRouter'))(AppAPI.UserSelfManager);//Edits or Deletes connected user in PUT
var UserValidator = (require('./routes/APIRouters/UserValidatorRouter'))(AppAPI.UserValidator);//Contains many validation middlewares (Authentication,SessionLeading,)
var UserFetcher = (require('./routes/APIRouters/UserFetcherRouter'))(AppAPI.UserFetcher);
var IdealSpacesBackEndRouter = (require('./routes/APIRouters/IdealSpacesBackEndRouter'))(AppAPI.UserFetcher);//Lets Ideal spaces communicade with this application
var idealspacesRouter = (require('./routes/idealspacesRouter'))(AppAPI.FrontEndToBackEnd);//Communicates with IdealSpaces to fetch projects
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('permission',{
    role:config.UserConfig.RoleAttributeName
});
app.set('Locale',Locale);
app.set('storeIntegration',storeIntegration);
app.set('DatabaseConfig',config.DatabaseConfig);
app.set('CustomConfig',config);



//Starup functions
if(config.AppConfig.CacheAllUsersOnStartup) {
    AppAPI.UserFetcher.GetAllUsers(app, function (AllUsers) {
        app.set('AllUsers', AllUsers);
    });
}

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//configure Logging
app.use(logger('dev'));
app.use(logger('combined',{stream:stream}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());//may be useless
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(UserValidator.loadSession);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//Pages that dont require to be authentified
//IdealSpaces BackEnd API
app.use('/BEAPI',UserValidator.permission(),IdealSpacesBackEndRouter);
app.delete('/BEAPI/Sessions',UserValidator.globalLogout,function(req,res){
    res.send(req.user.MakeSessionDTO());
});

if(!config.AppConfig.ProxyMode || config.AppConfig.LoginStub) {
    //Registration routing
    app.use('/register', register);
    app.post('/register', UserValidator.register, UserValidator.authenticate);
    app.post('/register/validate', UserValidator.validateUser, UserValidator.authenticate);
    //Forgot Password Routing
    app.use('/forgotpassword', forgotPassword);
    app.post('/forgotpassword', UserValidator.forgotPassword);
    app.post('/forgotpassword/validate', UserValidator.validateForgotPassword, UserValidator.authenticate);
    //Login routing
    app.use('/login', login);
    app.post('/login', UserValidator.authenticate);
    app.use('/logout/global', UserValidator.globalLogout, function (req, res) {
        //on success
        res.status(401);
        res.end();
    });
    app.use('/API', UserDBFrontEndToBackEnd);
}
//Pages that require authentification are routed below this point
app.use(UserValidator.permission());//when no roles are given, only check if user is authenticated
// set specific roles for paths here as middleware
if(!config.AppConfig.ProxyMode) {
    //this app can be used as a proxy, thus  are no views and only allows login/logout
    app.use('/statistics',UserValidator.permission(permissionConfig.ViewStoresStatistics));
    app.use('/searchuser',UserValidator.permission(permissionConfig.SearchUser));
    app.use('/searchproject',UserValidator.permission(permissionConfig.SearchProject));
    app.use('/myprofile/editprofile',UserValidator.permission(permissionConfig.ModifyAccount));
    app.use('/myprofile/myprojects',UserValidator.permission(permissionConfig.ViewMyProjects));
    app.use('/myprofile',UserValidator.permission(permissionConfig.ViewAccount));
    app.use('/user/profile',UserValidator.permission(permissionConfig.ViewUsers));
    app.use('/user/edit',UserValidator.permission(permissionConfig.EditUsers));
    app.use('/user/projects',UserValidator.permission(permissionConfig.ViewOthersProjects));
    app.use('/user/searchuser',UserValidator.permission(permissionConfig.SearchUser));
    app.use('/API/GetRoles', UserValidator.permission());
    app.use('/API/FindUsers', UserValidator.permission(permissionConfig.SearchUser));
    //Finally, let respective routers handle the rest
    app.use('/statistics', storeStats, queryManager);
    app.use('/statistics/RefreshUserList', function (req, res) {
        res.end(JSON.stringify(req.app.get('Locale')('msg.userlistupdate')));
        app.set('AllUsers', []);
        AppAPI.UserFetcher.GetAllUsers(app, function (AllUsers) {
            app.set('AllUsers', AllUsers);
        });
    });
    app.use('/isAPI', idealspacesRouter);
    app.use('/searchuser', searchuser);
    app.use('/searchproject', searchproject);
    app.use('/user', UserFetcher, idealspacesRouter, users);
    app.use(['/myprofile','/'], idealspacesRouter, viewprofile, UserSelfManager);
    //app.use('/', index);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error(req.app.get('Locale')('msg.notfound'));
    err.status = 404;
    next(err);
});

// error handler
//todo error Handler should defferent in PUT,POST and DELETE
app.use(function(err, req, res, next) {
    if(req.method === 'GET') {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        var template = 'error';
        if(req.isAuthenticated()){
            template += 'authenticated';
        }
        res.render(template,{
            title: config.ClientConfig.title,
            SessionUser:req.user,
            Locale:req.app.get('Locale')
        });
    }
    if(req.method === 'PUT' || req.method === 'POST') {

        res.status(err.status || 500);
        res.end(err.message);
    }
    if(req.method === 'DELETE') {
        res.status(err.status || 500);
        res.end(err.message);
    }
    if((err.status || 500) === 500){
        console.log(err);
    }

});

module.exports = app;
