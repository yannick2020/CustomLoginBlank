var User = require('../Objects/UserObject');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var TestUser = new User("Access","Refresh","Bob",10000,[{Name:"Test",Value:"Hey"},{Name:"Heyy",Value:"Hoo"},{Name:"Roles",Value:"admin"},{Name:"custom:Roles",Value:"user"}],config);


console.log(TestUser.UserCanTakeAction("UserInteractionRoles",["supercognitomgr"],"CanFind"));
