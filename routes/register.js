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
            title: req.app.get('Locale')('lbl.registertitle'),
            SubmitTxt:req.app.get('Locale')('lbl.registersubmit'),
            form:req.app.get('CustomConfig').ClientConfig.RegistrationFormFields,
            prefilledData:prefilledData,
            mandatoryFields:req.app.get('DatabaseConfig').mandatoryFields,
            Locale:req.app.get('Locale'),
            StoreData:req.app.get('CustomConfig').UserConfig.StoreIntegrationData
        }
    );
});

/*GET validation page*/
router.get('/validate', function(req, res, next) {
    var prefilledData = {
        username : (req.query.username||req.body.username),
        confirmation : (req.query.confirmation||req.body.confirmation),
        password:(req.query.password||req.body.password)
    };
    if(req.query.styleContext){
        var prefix = req.app.get('CustomConfig').ClientConfig.StyleContexts[req.query.styleContext];
    }
    res.render((prefix||'')+'simpleform',
        {
            title: req.app.get('Locale')('lbl.validatetitle'),
            SubmitTxt:req.app.get('Locale')('lbl.confirm'),
            form:req.app.get('CustomConfig').ClientConfig.ValidateRegistrationFormFields,
            prefilledData:prefilledData,
            mandatoryFields:req.app.get('DatabaseConfig').mandatoryFields,
            Locale:req.app.get('Locale')
        }
    );
});

module.exports = router;