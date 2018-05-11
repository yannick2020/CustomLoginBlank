var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get(['/profile','/profile/:uname'], function(req, res, next) {

    var userFetched = req.userFetched;
    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    res.render('userprofile', {
        title: clientConfig.title,
        SessionUser:req.user,
        user:userFetched,
        otherProfile:true,
        canEdit:req.user.UserCanTakeAction("UserInteractionRoles",userFetched.GetRoles(),"CanEditOthers"),
        searchuserActivated:true,
        Locale:req.app.get('Locale'),
        StoreData:req.app.get('CustomConfig').UserConfig.StoreIntegrationData
    });
});

router.get(['/edit/:uname'], function(req, res, next) {
    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    res.render('modifyuser', {
        title: clientConfig.title,
        SessionUser:req.user,
        user:req.userFetched,
        otherProfile:true,
        cancelCallback:'../profile/'+req.userFetched.username,
        searchuserActivated:true,
        roleKey:req.app.get('permission').role,
        mandatoryFields:req.app.get('DatabaseConfig').mandatoryFields,
        Locale:req.app.get('Locale'),
        StoreData:req.app.get('CustomConfig').UserConfig.StoreIntegrationData
    });
});

router.get('/projects/:uname', function(req, res, next) {
    var userFetched = req.userFetched;
    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    res.render('userprojects', {
        title: clientConfig.title,
        SessionUser:req.user,
        user:userFetched,
        projects:req.userProjects,
        projectsCollab:req.userProjectsCollab,
        searchuserActivated:true,
        Locale:req.app.get('Locale')
    });
});

router.get('/searchuser', function(req, res, next) {
    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    res.render('searchuser', {
        title: clientConfig.title,
        SessionUser:req.user,
        searchuserActivated:true,
        Locale:req.app.get('Locale')
    });
});

module.exports = router;
