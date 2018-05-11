var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    if(req.isAuthenticated()) {
        res.render('index', {
            title: clientConfig.title,
            SessionUser:req.user,
            user: req.user,
            homeActivated: true,
            Locale:req.app.get('Locale')
        });
    }else{
        res.render('login', { title: req.app.get('CustomConfig').ClientConfig.title,Locale:req.app.get('Locale')});
    }
});

module.exports = router;
