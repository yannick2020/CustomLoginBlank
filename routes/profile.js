var express = require('express');
var router = express.Router();
/* GET connected user profile page. */
router.get('/', function(req, res, next) {

    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    res.render('userprofile', {
        title: clientConfig.title,
        SessionUser:req.user,
        user:req.user,
        profileActivated:true,
        Locale:req.app.get('Locale'),
        StoreData:req.app.get('CustomConfig').UserConfig.StoreIntegrationData

    });
});

router.get('/editprofile', function(req, res, next) {
    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    res.render('modifyuser', {
        title: clientConfig.title,
        SessionUser:req.user,
        user:req.user,
        cancelCallback:'./',
        profileActivated:true,
        roleKey:req.app.get('permission').role,
        mandatoryFields:req.app.get('DatabaseConfig').mandatoryFields,
        Locale:req.app.get('Locale'),
        StoreData:req.app.get('CustomConfig').UserConfig.StoreIntegrationData
    });
});
router.get('/myprojects', function(req, res, next) {
    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    res.render('userprojects', {
        title: clientConfig.title,
        SessionUser:req.user,
        user:req.user,
        projects:req.userProjects,
        projectsCollab:req.userProjectsCollab,
        profileActivated:true,
        Locale:req.app.get('Locale')
    });
});


module.exports = router;
