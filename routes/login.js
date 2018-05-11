var express = require('express');
var router = express.Router();



/* GET login page. */
router.get('/', function(req, res, next) {
    if(req.query.styleContext){
        var prefix = req.app.get('CustomConfig').ClientConfig.StyleContexts[req.query.styleContext];
    }
    res.render((prefix||'')+'login',
        {
            title: req.app.get('Locale')('lbl.logintitle'),
            Locale:req.app.get('Locale'),
            ClientLinks:{PrivacyPolicy:req.app.get('CustomConfig').ClientConfig.PrivacyPolicyLink,TermsAndConditions:req.app.get('CustomConfig').ClientConfig.TermsAndConditionsLink}
        });

});

module.exports = router;