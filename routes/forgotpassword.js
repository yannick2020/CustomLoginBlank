var express = require('express');
var router = express.Router();

/* GET registration page. */
router.get('/', function(req, res, next) {
    var prefilledData = {
    };
    if(req.query.styleContext){
        var prefix = req.app.get('CustomConfig').ClientConfig.StyleContexts[req.query.styleContext];
    }
    res.render((prefix||'')+'simpleform',
        {
            title: req.app.get('Locale')('lbl.forgotpasswordtitle'),
            SubmitTxt:req.app.get('Locale')('lbl.forgotpasswordsubmit'),
            form:req.app.get('CustomConfig').ClientConfig.ForgotPasswordFormFields,
            prefilledData:prefilledData,
            mandatoryFields:req.app.get('DatabaseConfig').mandatoryFields,
            Locale:req.app.get('Locale')
        }
    );
});

/*GET validation page*/
router.get('/validate', function(req, res, next) {
    var prefilledData = {
        username : req.query.username,
        confirmation : req.query.confirmation
    };
    if(req.query.styleContext){
        var prefix = req.app.get('CustomConfig').ClientConfig.StyleContexts[req.query.styleContext];
    }
    res.render((prefix||'')+'simpleform',
        {
            title: req.app.get('Locale')('lbl.forgotpasswordtitle'),
            SubmitTxt:req.app.get('Locale')('lbl.confirm'),
            form:req.app.get('CustomConfig').ClientConfig.ValidateForgotPasswordFormFields,
            prefilledData:prefilledData,
            mandatoryFields:req.app.get('DatabaseConfig').mandatoryFields,
            Locale:req.app.get('Locale')
        }
    );
});

module.exports = router;