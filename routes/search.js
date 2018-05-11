var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('search', {user:req.user,Locale:req.app.get('Locale')});
});

module.exports = router;