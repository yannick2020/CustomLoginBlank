function LoadValidator(API){
    function UserValidator(API){
        this.authenticate = [API.authenticate];
        this.loadSession = [function(req,res,next){
            req.isAuthenticated = function(){
                return !!(this["user"]);
            };
            next();
        },API.loadSession];
        this.permission = function(roles){return function(req,res,next){
            //checks if the user is logged in at least
            if (!req.isAuthenticated()){
                res.render('login', { title: req.app.get('CustomConfig').ClientConfig.title,Locale:req.app.get('Locale')});
                /**
                 //the user is not authenticated
                 res.status(Unauthenticated.status);
                 if(req.method === 'GET') {
                    res.redirect(Unauthenticated.redirect);
                }
                 if(req.method === 'PUT' || req.method === 'POST') {
                    res.end('You are not logged in or have timed out. You will be redirected to the login page');
                }
                 */
            } else {
                if (req.user.CheckRoles(roles)) {
                    if (req.user.expiration && req.user.expiration <= 300000) {
                        console.log('refreshingToken');
                        if(req.user.hasOwnProperty("refreshToken")){
                            //refreshToken(next);
                            next();
                        }
                    } else {
                        next();
                    }
                } else {
                    var err = new Error(req.app.get('Locale')('msg.accessdenied'));
                    err.status = 403;
                    next(err);
                }
            }
        }};
        this.globalLogout = [API.globalLogout];
        this.register = [function(req,res,next){
            var invalidFormFields=[];
            if(!req.body.username){
                req.body.username = req.body.email.replace('@','_at_');
            }
            var validForm = (function(body){
                var validForm = true;
                var formFields = req.app.get('CustomConfig').ClientConfig.RegistrationFormFields;
                var mandatoryFields = req.app.get('DatabaseConfig').mandatoryFields;
                for(var i=0;i<formFields.length ;i++){
                    if(mandatoryFields[formFields[i]]){
                        if(body.hasOwnProperty(formFields[i]) && body[formFields[i]] === ""){
                            invalidFormFields.push(formFields[i]);
                            validForm = false;
                        }else if(!body.hasOwnProperty(formFields[i])){
                            invalidFormFields.push(formFields[i]);
                            validForm = false;
                        }
                    }
                }
                if(body.confirmemail){
                    validForm = body.confirmemail === body.email;
                    invalidFormFields.push('confirmemail');
                    delete body.confirmemail;
                }
                if(body.confirmpassword){
                    validForm = body.confirmpassword === body.password;
                    invalidFormFields.push('confirmpassword');
                    delete body.confirmpassword;
                }
                return validForm;
            })(req.body);
            if(!validForm) {
                invalidFormFields = invalidFormFields.map(function (field) {
                    return req.app.get('Locale')("lbl."+field);
                });
                var error = new Error(req.app.get('Locale')('msg.invalidfields')+invalidFormFields.toString());
                error.status = 400;
                next(error);
            }else{
                next();
            }
        },API.register];
        this.validateUser = [function(req,res,next){
            var username = req.body.username;
            var confirmationCode = req.body.confirmation;
            var password = req.body.password;
            if(!(username && confirmationCode && password)){
                var error = new Error(req.app.get('Locale')('msg.incompleteform'));
                error.status = 400;
                next(error);
            }else{
                next();
            }
        },API.validateUser];
        this.forgotPassword = [function(req,res,next){
            var username = (req.body.username||req.body.email);//the user can also submit an email
            if(!(username)) {
                //todo configurable email only?
                var error = new Error(req.app.get('Locale')('msg.incompleteform'));
                error.status = 400;
                next(error);
            }else{
                next();
            }
        },API.forgotPassword];
        this.validateForgotPassword = [function(req,res,next){
            var username = (req.body.username||req.body.email);//the user can also submit an email
            var confirmationCode = req.body.confirmation;
            var newPassword = req.body.password;
            if(!(username &&confirmationCode&&newPassword)) {
                //todo configurable email only?
                res.status(400);
                res.end(req.app.get('Locale')('msg.incompleteform'));
            }else{
                next();
            }
        },API.validateForgotPassword];
    }
    return new UserValidator(API);
}
module.exports = LoadValidator;
