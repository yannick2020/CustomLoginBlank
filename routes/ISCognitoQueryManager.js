var express = require('express');
/**
 * Router that will manage queries that combine IdealSpaces and Cognito
 * All router methods should not render any page
 * req.AllUsers contains every users in the cognito userpool and needs to be setup in a previous middleware
 * @module ISQueryManager
 * @copyright 20-20 Technologies Inc. All rights reserved.
 */
var router = express.Router();
var request = require('request');
function userCreatedProject(params,callbacks){
    //position,jump,next
    var users = params.users;
    var url = params.url;
    var connectedUser = params.SessionUser;
    var role = params.ProjectRole;
    var extraQuery = (params.ExtraQuery)? ' AND ' +params.ExtraQuery.join(' AND '):'';
    var onSuccess = (callbacks.onSuccess||console.log);
    var onFailure = (callbacks.onFailure||console.log);
    var usersIS = users.map(function(user){
        return "collabs_ss:"+role+"\\:"+user.GetIdealSpacesId();
    });
    var querey = "NOT name_s_lower:c74239f5\\-db2a\\-4571\\-8a0a\\-9d7ad71ac721 AND ("+usersIS.join(' OR ')+")"+extraQuery;
    var uri = 'ProjectSearchResults';
    var API2link = 'API2/';
    var options = {
        method:'POST',
        url:url+API2link+uri,
        headers:{
            'Authorization':'Bearer '+connectedUser['bearerToken'],
            'content-type': 'application/json'
        },
        body:JSON.stringify({query:querey,limit:5000})
    };
    request(options,function(err,response,body){
        if(response && response.statusCode === 200) {
            onSuccess(body);
        }else{
            try{
                console.log(body);
                var error = new Error(JSON.parse(body)["Message"]);
                error.status = response.statusCode;
                onFailure(error);
            }catch(e){
                if(err){
                    onFailure(err);
                }else{
                    onFailure(e);
                }
            }
        }
    });
}
function concatProjects(Projects,AddedProjects){
    var ConcactedProjects = Projects;
    AddedProjects.map(function(newproject){
        var projectUnique = ConcactedProjects.find(function(project){
           return project.prjId_s === newproject.prjId_s
        });
        if(!projectUnique){
            ConcactedProjects.push(newproject);
        }
    });
    return ConcactedProjects;
}
router.use(function(req,res,next){
    if(req.app.get('AllUsers')&&req.app.get('AllUsers').length !==0){
        next();
    }else{
        var error = new Error(req.app.get('Locale')('msg.userlistnotready'));
        error.status = 503;
        next(error);
    }
});
//Router method that will return the number of designers and various queries for all store
router.post('/GetDesignerNumber', function(req, res, next) {
    //assign arrays
    var designers = [];
    var userList =[];
    var designerCreatedProjects=[];
    var userCreatedProjects=[];
    var userCreatedProjectsNeedHelp=[];
    var userCreatedProjectsHelpReceived=[];
    var userCreatedProjectsCollaborating=[];

    //date query manage
    var dateFrom = (req.body.dateFrom)?(new Date(req.body.dateFrom).toJSON()):new Date('2010-01-01').toJSON();
    var dateTo = (req.body.dateTo)?(new Date(req.body.dateTo).toJSON()): new Date().toJSON();
    var specialChars = new RegExp(/[+\-&|!(){}\[\]^"~*?:]/,'g');
    dateFrom = dateFrom.replace(specialChars,'\\'+'$&');
    dateTo = dateTo.replace(specialChars,'\\'+'$&');
    var DateQuery = 'modOn_dt:['+dateFrom+' TO '+dateTo +']';
    console.log(DateQuery);
    //this is the template for all statistics for each stores, it is copied in every StoreDesignerCount[store]
    var StoreInitValue = {
        "NoDesigners":0,
        "NoDesignersActivated":0,
        "NoDesignersCreatedProject":0,
        "NoDesignersCollaborating":0,
        "NoDesignersCollaboratingRequested":0,

        "NoUsers":0,
        "NoUsersActivated":0,
        "NoUsersCreatedProject":0,
        "NoUsersCollaborating":0,
        "NoUsersRequestHelp":0,
        "NoUsersHelpReceived":0,

        "NoProjectsCollaborating":0,
        "NoProjectsRequestHelp":0,
        "NoProjectsHelpReceived":0,
        "NoProjectsDesignerCreated":0,
        "NoProjectsUserCreated":0
    };
    var StoreDesignerCount = {
        Total:Object.assign({}, StoreInitValue)
    };
    var storeDescriptions = {};
    req.app.get('storeIntegration').map(function(config){
        if(config.hasOwnProperty("name")&&config.name==="storeDescriptionList"){
            storeDescriptions.name=config.name;
            storeDescriptions.value = {};
            config.value.map(function(store){
                storeDescriptions.value[store.name] = store.value;
            });
        }
    });
    //Gets all the users and split those that have a Designer role and those without roles
    req.app.get('AllUsers').map(function(user){
        if(user.GetRoles().indexOf("Designer")>-1){
            designers.push(user)
        }else if(user.GetRoles().length === 0){
            userList.push(user)
        }
    });
    designers.map(function (designer) {
        var currentStore = "000,Unassigned";
        if (designer.hasOwnProperty("custom:CustomData")) {
            currentStore = designer.GetStoreID()+","+(storeDescriptions.value[designer.GetStoreID()]||"Unassigned");
        }
        if ((StoreDesignerCount[currentStore] === undefined)) {
            StoreDesignerCount[currentStore] = Object.assign({}, StoreInitValue);
        }
        StoreDesignerCount[currentStore]["NoDesigners"]++;
        if (designer["UserStatus"] !== "RESET_REQUIRED") {
            StoreDesignerCount[currentStore]["NoDesignersActivated"]++;
        }
    });
    userList.map(function (user) {
        var currentStore = "000,Unassigned";
        if (user.hasOwnProperty("custom:CustomData")) {
            currentStore = user.GetStoreID()+","+(storeDescriptions.value[user.GetStoreID()]||"Unassigned");
        }
        if ((StoreDesignerCount[currentStore] === undefined)) {
            StoreDesignerCount[currentStore] = Object.assign({}, StoreInitValue);
        }
        StoreDesignerCount[currentStore]["NoUsers"]++;
        if (user["email_verified"] === "true") {
            StoreDesignerCount[currentStore]["NoUsersActivated"]++;
        }
    });
    var DesignerSplitQueriesCompleted = [false];
    var UserSplitQueriesCompleted = [false];
    function SplitDesigners(start,jump,errorCallback) {
        var designerSection = designers.slice(start,start+jump);
        var counter = start/jump;
        var QueriesCompleted = [false];
        var parameters = {
            users:designerSection,
            url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL,
            SessionUser:req.user,
            ProjectRole:"ProjectOwner",
            ExtraQuery:[DateQuery]
        };
        userCreatedProject(parameters, {
            onFailure:function(error){
                errorCallback(error)
            },
            onSuccess:function(body) {
                var createdProject = [];
                try {
                    createdProject = (JSON.parse(body)["Results"]);
                } catch (e) {
                }
                designerCreatedProjects=concatProjects(designerCreatedProjects,createdProject);
                QueriesCompleted[0]=true;
            }
        });
        var QueryChecker = setInterval(function(){
            if(!QueriesCompleted.some(function(query){return !query})){
                if(designers.indexOf(designerSection[(designerSection.length-1)]) === (designers.length-1)){
                    DesignerSplitQueriesCompleted[counter] = true;
                }else{
                    SplitDesigners((start+jump),jump,errorCallback);
                }
                clearInterval(QueryChecker);
            }
        },100);
    }

    function SplitUsers(start,jump,errorCallback) {
        var usersSection = userList.slice(start,start+jump);
        var counter = start/jump;
        var QueriesCompleted=[false,false,false,false];
        //First Query
        var parameters = {
            users:usersSection,
            url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL,
            SessionUser:req.user,
            ProjectRole:"ProjectOwner",
            ExtraQuery:[DateQuery]
        };
        userCreatedProject(parameters, {
            onFailure:function(error){
                errorCallback(error)
            },
            onSuccess:function(body) {
                var createdProject = [];
                try {
                    createdProject = (JSON.parse(body)["Results"]);
                } catch (e) {
                }
                userCreatedProjects=concatProjects(userCreatedProjects,createdProject);
                QueriesCompleted[0] = true
            }
        });
        //Second Query
        parameters = {
            users:usersSection,
            url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL,
            SessionUser:req.user,
            ProjectRole:"ProjectOwner",
            ExtraQuery:['custData_t:"\\"ContactRequested\\"\\:true"',DateQuery]
        };
        userCreatedProject(parameters,{
            onFailure:function(error){
                errorCallback(error)
            },
            onSuccess:function(body) {
                var createdProject = [];
                try {
                    createdProject = (JSON.parse(body)["Results"]);
                } catch (e) {
                }
                userCreatedProjectsNeedHelp=concatProjects(userCreatedProjectsNeedHelp,createdProject);
                QueriesCompleted[1] = true
            }
        });
        //Third Query
        parameters = {
            users:usersSection,
            url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL,
            SessionUser:req.user,
            ProjectRole:"ProjectOwner",
            ExtraQuery:['custData_t:"\\"ContactRequested\\"\\:true"','collabs_ss:*ProjectAdmin*',DateQuery]
        };
        userCreatedProject(parameters,{
            onFailure:function(error){
                errorCallback(error)
            },
            onSuccess:function(body) {
                var createdProject = [];
                try {
                    createdProject = (JSON.parse(body)["Results"]);
                } catch (e) {
                }
                userCreatedProjectsHelpReceived=concatProjects(userCreatedProjectsHelpReceived,createdProject);
                QueriesCompleted[2] = true
            }
        });
        //Fourth Query
        parameters = {
            users:usersSection,
            url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL,
            SessionUser:req.user,
            ProjectRole:"ProjectOwner",
            ExtraQuery:['collabs_ss:*ProjectAdmin*',DateQuery]
        };
        userCreatedProject(parameters,{
            onFailure:function(err){
                errorCallback(err);
            },
            onSuccess:function(body){
                var createdProject = [];
                try {
                    createdProject = (JSON.parse(body)["Results"]);
                } catch (e) {
                }
                userCreatedProjectsCollaborating=concatProjects(userCreatedProjectsCollaborating,createdProject);
                QueriesCompleted[3] = true
            }
        });

        var QueryChecker = setInterval(function(){
            if(!QueriesCompleted.some(function(query){return !query})){
                if(userList.indexOf(usersSection[(usersSection.length-1)]) === (userList.length-1)){
                    UserSplitQueriesCompleted[counter] = true;
                }else{
                    SplitUsers((start+jump),jump);
                }
                clearInterval(QueryChecker);
            }
        },100);
    }

    /**
     * This method will count the users from userList collaborating in at least one project from projectList that has the role projectRole
     * and will count them as the statistic countingKey
     * @param countingKey The statistic that will be counted
     * @param projectList The list of projects that will be counted from
     * @param projectRole the role of the user to count
     * @param userList the list of users
     */
    function projectUserStatCounter(countingKey, projectList, projectRole,userList) {
        if (projectList.length > 0) {
            var projectCollaborators = projectList.map(function (project) {
                return {collabs_ss: project.collabs_ss, intgr_s: JSON.parse(project.intgr_s)};
            });
            for (var i = 0, userCounted = false; i < userList.length &&!userCounted; i++,userCounted=false) {
                for (var j = 0; j < projectCollaborators.length; j++) {
                    var currentStore = "000,Unassigned";
                    if (projectCollaborators[j].intgr_s.hasOwnProperty("storeID")) {
                        var projectStoreId = projectCollaborators[j].intgr_s["storeID"];
                        if ((typeof projectStoreId === "string") && projectStoreId.includes(':')) {
                            projectStoreId = projectStoreId.split(':')[1];
                        }else if (typeof projectStoreId !=="string"){
                            projectStoreId = projectStoreId.toString();
                        }
                        if (projectStoreId.length === 1) {
                            projectStoreId = '00' + projectStoreId
                        }
                        if (projectStoreId.length === 2) {
                            projectStoreId = '0' + projectStoreId
                        }
                        currentStore = projectStoreId + "," + (storeDescriptions.value[projectStoreId] || ("Unassigned"));
                    }
                    if ((StoreDesignerCount[currentStore] === undefined)) {
                        StoreDesignerCount[currentStore] = Object.assign({}, StoreInitValue);
                    }
                    if (projectCollaborators[j].collabs_ss.indexOf(projectRole + ":" + userList[i].GetIdealSpacesId()) > -1) {
                        if (!userCounted) {
                            StoreDesignerCount[currentStore][countingKey]++;
                            userCounted = true;
                        }
                    }
                }
            }
        }
    }

    /**
     * Counts a statistic in an array of projects for every store
     * @param projectList the project list to count
     * @param statKey the statistic key to count
     */
    function countProjectStores(projectList,statKey){
        if (projectList.length > 0) {
            var projectCollaborators = projectList.map(function (project) {
                return {collabs_ss: project.collabs_ss, intgr_s: JSON.parse(project.intgr_s)};
            });
            for (var j = 0, userCounted = false; j < projectCollaborators.length && !userCounted; j++) {
                    var currentStore = "000,Unassigned";
                    if (projectCollaborators[j].intgr_s.hasOwnProperty("storeID")) {
                        var projectStoreId = projectCollaborators[j].intgr_s["storeID"];
                        if ((typeof projectStoreId === "string") && projectStoreId.includes(':')) {
                            projectStoreId = projectStoreId.split(':')[1];
                        }else if (typeof projectStoreId !=="string"){
                            //console.log(projectCollaborators[j]);
                            projectStoreId = projectStoreId.toString();
                        }
                        if(projectStoreId.length ===1){
                            projectStoreId = '00'+projectStoreId
                        }
                        if(projectStoreId.length ===2){
                            projectStoreId = '0'+projectStoreId
                        }
                        currentStore = projectStoreId+","+(storeDescriptions.value[projectStoreId] ||("Unassigned"));
                    }
                    if ((StoreDesignerCount[currentStore] === undefined)) {
                        StoreDesignerCount[currentStore] = Object.assign({}, StoreInitValue);
                    }
                    StoreDesignerCount[currentStore][statKey]++;
            }
        }
    }
    var ErrorOccured = false;
    var userJump = 700;

    SplitDesigners(0, userJump,function(err){
        if(!ErrorOccured){
            ErrorOccured = true;
            next(err);
        }
    });
    SplitUsers(0, userJump,function(err){
        if(!ErrorOccured){
            ErrorOccured = true;
            next(err);
        }
    });
    /*
    for(i=0;i<designers.length&&!ErrorOccured;i+=userJump){
        SplitDesigners(i, i+userJump,function(err){
            if(!ErrorOccured){
                ErrorOccured = true;
                next(err);
            }
        });
    }
    for(i=0;i<userList.length&&!ErrorOccured;i+=userJump){
        SplitUsers(i, i+userJump,function(err){
            if(!ErrorOccured){
                ErrorOccured = true;
                next(err);
            }
        });
    }
    */


    var Interval =setInterval(
        function(){
            var DesignerQueryCompleted = !DesignerSplitQueriesCompleted.some(function(queries){return !queries});
            var UserQueryCompleted = !UserSplitQueriesCompleted.some(function(queries){return !queries});
            if(DesignerQueryCompleted&&UserQueryCompleted && !ErrorOccured)  {
                countTotal();
                clearInterval(Interval);
            }
        },
        100);
    //SplitDesigners(0,700,next);
    function countTotal(){
        //Counts and sorts statistics for each store

        //COUNT NUMBER OF USERS
        //Counts how many desiners created projects
        projectUserStatCounter("NoDesignersCreatedProject",designerCreatedProjects,"ProjectOwner",designers);
        //counts how many desiners collaborated in user created projects
        projectUserStatCounter("NoDesignersCollaborating",userCreatedProjects,"ProjectAdmin",designers);
        //counts how many desiners collaborated in projects that requested help
        projectUserStatCounter("NoDesignersCollaboratingRequested",userCreatedProjectsNeedHelp,"ProjectAdmin",designers);
        //counts how many users created a project
        projectUserStatCounter("NoUsersCreatedProject",userCreatedProjects,"ProjectOwner",userList);
        //counts how many users are collaborating in projects
        projectUserStatCounter("NoUsersCollaborating",userCreatedProjects,"ProjectCollaborator",userList);
        //counts how many users requested help
        projectUserStatCounter("NoUsersRequestHelp",userCreatedProjectsNeedHelp,"ProjectOwner",userList);
        //counts how many users received help
        projectUserStatCounter("NoUsersHelpReceived",userCreatedProjectsHelpReceived,"ProjectOwner",userList);

        //COUNT NUMBER OF PROJECTS
        //counts how many projects are created by desiners
        countProjectStores(designerCreatedProjects,"NoProjectsDesignerCreated");
        //counts how many projects are created by users
        countProjectStores(userCreatedProjects,"NoProjectsUserCreated");
        //counts how many projects are created by users and has a ProjectAdmin collaborator
        countProjectStores(userCreatedProjectsCollaborating,"NoProjectsCollaborating");
        //counts how many projects created by users are requesting help
        countProjectStores(userCreatedProjectsNeedHelp,"NoProjectsRequestHelp");
        //counts how many projects created by users are requesting help and has a ProjectAdmin collaborating
        countProjectStores(userCreatedProjectsHelpReceived,"NoProjectsHelpReceived");

        //Counts a total for all stats
        for(store in StoreDesignerCount){
            if(!store.includes("Magasin Test")) {
                for (stats in StoreDesignerCount[store]) {
                    StoreDesignerCount.Total[stats] += StoreDesignerCount[store][stats]
                }
            }else{
                //delete StoreDesignerCount[store];//will remove Magasin Test from statistics
            }
        }
        var fileString = "";
        for(store in StoreDesignerCount){
            if(store === 'Total'){
                fileString+='000,'
            }
            fileString+=store+',';
            for (stats in StoreDesignerCount[store]) {
                fileString+=StoreDesignerCount[store][stats]+',';
            }
            fileString+='\n';
        }
        /*
        fs.writeFile('StatisticsStores.csv',fileString,{},function(err){
            if(err){
                console.log(err);
            }else{
                var options = {
                    root: '././',
                    headers: {
                        'x-timestamp': Date.now(),
                        'x-sent': true
                    }
                };
            }
        });
        */
        res.send(fileString);
    }

});

router.post('/GetUserNumber',function(req,res,next){
    var userList = [];
    var userCreatedProjects=[];
    var userCreatedProjectsNeedHelp=[];
    var userCreatedProjectsHelpReceived=[];
    var userCreatedProjectsCollaborating=[];
    var UserInitValue = {
        "NoProjectsUserCreated":0,
        "NoProjectsCollaborating":0,
        "NoProjectsRequestHelp":0,
        "NoProjectsHelpReceived":0
    };
    var dateFrom = (req.body.dateFrom)?(new Date(req.body.dateFrom).toJSON()):new Date('2010-01-01').toJSON();
    var dateTo = (req.body.dateTo)?(new Date(req.body.dateTo).toJSON()): new Date().toJSON();
    var specialChars = new RegExp(/[+\-&|!(){}\[\]^"~*?:]/,'g');
    dateFrom = dateFrom.replace(specialChars,'\\'+'$&');
    dateTo = dateTo.replace(specialChars,'\\'+'$&');
    var DateQuery = 'modOn_dt:['+dateFrom+' TO '+dateTo +']';
    var UserCount = {
        Total:Object.assign({}, UserInitValue)
    };

    req.app.get('AllUsers').map(function(user){
        if(user.GetRoles().length === 0 && (user.GetStoreID()!=='713' &&user.GetStoreID()!=='971')){
            userList.push(user);

        }
    });
    function SplitUsers(start,jump) {
        var usersSection = userList.slice(start,start+jump);
        var parameters = {
            users:usersSection,
            url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL,
            SessionUser:req.user,
            ProjectRole:"ProjectOwner",
            ExtraQuery:[DateQuery]
        };

        userCreatedProject(parameters, {
            onFailure:function(error){
                next(error)
            },
            onSuccess:function(body) {
                var createdProject = [];
                try {
                    createdProject = (JSON.parse(body)["Results"]);
                } catch (e) {
                }
                userCreatedProjects=concatProjects(userCreatedProjects,createdProject);
                var parameters = {
                    users:usersSection,
                    url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL,
                    SessionUser:req.user,
                    ProjectRole:"ProjectOwner",
                    ExtraQuery:['custData_t:"\\"ContactRequested\\"\\:true"',DateQuery]
                };
                userCreatedProject(parameters,{
                    onFailure:function(error){
                        next(error)
                    },
                    onSuccess:function(body) {
                        var createdProject = [];
                        try {
                            createdProject = (JSON.parse(body)["Results"]);
                        } catch (e) {
                        }
                        userCreatedProjectsNeedHelp=concatProjects(userCreatedProjectsNeedHelp,createdProject);
                        var parameters = {
                            users:usersSection,
                            url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL,
                            SessionUser:req.user,
                            ProjectRole:"ProjectOwner",
                            ExtraQuery:['custData_t:"\\"ContactRequested\\"\\:true" AND collabs_ss:*ProjectAdmin*',DateQuery]
                        };
                        userCreatedProject(parameters,{
                            onFailure:function(error){
                                next(error)
                            },
                            onSuccess:function(body) {
                                var createdProject = [];
                                try {
                                    createdProject = (JSON.parse(body)["Results"]);
                                } catch (e) {
                                }
                                userCreatedProjectsHelpReceived=concatProjects(userCreatedProjectsHelpReceived,createdProject);
                                var parameters = {
                                    users:usersSection,
                                    url:req.app.get('CustomConfig').AppConfig.IdealSpacesURL,
                                    SessionUser:req.user,
                                    ProjectRole:"ProjectOwner",
                                    ExtraQuery:['collabs_ss:*ProjectAdmin*',DateQuery]
                                };
                                userCreatedProject(parameters,{
                                    onFailure:function(err){
                                        next(err);
                                    },
                                    onSuccess:function(body){
                                        var createdProject = [];
                                        try {
                                            createdProject = (JSON.parse(body)["Results"]);
                                        } catch (e) {
                                        }
                                        userCreatedProjectsCollaborating=concatProjects(userCreatedProjectsCollaborating,createdProject);
                                        if(userList.indexOf(usersSection[(usersSection.length-1)]) === (userList.length-1)){
                                            countTotal();
                                        }else{
                                            SplitUsers((start+jump),jump);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });

            }
        });
    }
    SplitUsers(0, 700);

    function countTotal(){
        //Counts and sorts statistics for each store
        //COUNT NUMBER OF USERS
        //counts how many users created a project
        countProjectUsers("NoProjectsUserCreated",userCreatedProjects,"ProjectOwner",userList);
        //counts how many users are collaborating in projects
        countProjectUsers("NoProjectsCollaborating",userCreatedProjects,"ProjectCollaborator",userList);
        //counts how many users requested help
        countProjectUsers("NoProjectsRequestHelp",userCreatedProjectsNeedHelp,"ProjectOwner",userList);
        //counts how many users received help
        countProjectUsers("NoProjectsHelpReceived",userCreatedProjectsHelpReceived,"ProjectOwner",userList);

        //Counts a total for all stats
        for(store in UserCount){
            if(!store.includes("Magasin Test")) {
                for (stats in UserCount[store]) {
                    UserCount.Total[stats] += UserCount[store][stats]
                }
            }else{
                //delete UserCount[store];//will remove Magasin Test from statistics
            }
        }
        //Counts a total for all stats
        var fileString = "";
        for(store in UserCount){
            fileString+=store+',';
            for (stats in UserCount[store]) {
                fileString+=UserCount[store][stats]+',';
                UserCount.Total[stats] += UserCount[store][stats]
            }
            fileString+='\n';
        }
        res.send(fileString);
    }
    function countProjectUsers(countingKey, projectList, projectRole,userList) {
        if (projectList.length > 0) {
            var projectCollaborators = projectList.map(function (project) {
                return {collabs_ss: project.collabs_ss, intgr_s: JSON.parse(project.intgr_s)};
            });
            for (var i = 0; i < userList.length ; i++) {
                for (var j = 0; j < projectCollaborators.length; j++) {
                    var currentUser = userList[i].email;

                    if (projectCollaborators[j].collabs_ss.indexOf(projectRole + ":" + userList[i].GetIdealSpacesId()) > -1) {
                        if ((UserCount[currentUser] === undefined)) {
                            UserCount[currentUser] = Object.assign({},UserInitValue)//todo check if this should be assigned later
                        }
                        UserCount[currentUser][countingKey]++;
                    }
                }
            }
        }
    }

});

router.post('/GetStatus',function(req,res,next){
    if(req.app.get('AllUsers')&&req.app.get('AllUsers').length !==0){
        res.send(req.app.get('Locale')('msg.userlistready'));
    }
});
module.exports= router;