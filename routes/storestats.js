var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    res.render('statistics', {
        title: clientConfig.title,
        SessionUser:req.user,
        user:req.user,
        statsActivated:true,
        storeIntegration:req.app.get('storeIntegration'),
        Locale:req.app.get('Locale')
    });
});

module.exports = router;
