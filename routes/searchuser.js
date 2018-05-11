var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var clientConfig = req.app.get('CustomConfig').ClientConfig;
    res.render('searchuser', {
        title: clientConfig.title,
        SessionUser:req.user,
        searchuserActivated:true,
        Locale:req.app.get('Locale')
    });
});

module.exports = router;
