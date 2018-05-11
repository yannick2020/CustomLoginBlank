var express = require('express');
var request = require('request');

var API2link = 'API2/';

function makeQueryText(body,collaborators,userParams){
    var specialChars = new RegExp(/[+\-&|!(){}\[\]^"~*?:]/,'g');
    var role = (body.ProjectRole)?body.ProjectRole+"\\:":"";
    var usersIS=[];
    if(collaborators.length!==0){
         usersIS = collaborators.map(function(user){
            return "collabs_ss:"+role+"*"+user.GetIdealSpacesId()+"*";
        });
    }else if (role){
        usersIS = ["collabs_ss:"+role+'*']
    }

    var queryArray = [];

    if(body.hasOwnProperty("dateFrom")||body.hasOwnProperty("dateTo")){
        var dateFrom = (body.dateFrom!=="")?(new Date(body.dateFrom).toJSON()):new Date('2010-01-01').toJSON();
        var dateTo = (body.dateTo!=="")?(new Date(body.dateTo).toJSON()): new Date().toJSON();
        dateFrom = dateFrom.replace(specialChars,'\\'+'$&');
        dateTo = dateTo.replace(specialChars,'\\'+'$&');
        queryArray.push('modOn_dt:['+dateFrom+' TO '+dateTo +']');
    }
    if(body.NeedHelp ){
        queryArray.push(' custData_t:"\\"ContactRequested\\"\\:true"');
    }
    if(userParams.isLimited){
        queryArray.push('intgr_s:*'+userParams.StoreID+'*');
    }else if(body["StoreID"]){
        queryArray.push('intgr_s:*\\"'+body["StoreID"]+'\\"*');
    }
    queryArray.push('NOT name_s_lower:c74239f5\\-db2a\\-4571\\-8a0a\\-9d7ad71ac721');
    if(body['collabs_ss']){
        if( body['collabs_ss'].includes(',')){
            body['collabs_ss'] = body['collabs_ss'].split(',');
            for(i=0;i<body['collabs_ss'].length;i++){
                body['collabs_ss'][i] = body['collabs_ss'][i].replace(specialChars,'\\'+'$&');
                queryArray.push('collabs_ss'+':*'+body['collabs_ss'][i]+'*');
            }
        }else{
            body['collabs_ss'] = body['collabs_ss'].replace(specialChars, '\\' + '$&');
            queryArray.push('collabs_ss' + ':*' + body['collabs_ss'] + '*');
        }
    }
    if(body['query']){
            body['query'] = body['query'].replace(specialChars, '\\' + '$&');
            queryArray.push('(name_s_lower:*' + body['query'] + '* OR desc_t:*' + body['query'] + '*)');
    }
    if(usersIS.join(' OR ')){
        queryArray.push('('+usersIS.join(' OR ')+')');
    }
    //queryArray.push('NOT intgr_s:*971*');
    //queryArray.push('NOT intgr_s:*713*');
    return queryArray.join(' AND ')
}

//this router will communicate with the ideal spaces back end.
function LoadRouter(API) {
    var router = express.Router();
    router.post('/AddSelf', function (req, res, next) {
        if (req.body.hasOwnProperty('projectid')) {
            var url = req.app.get('CustomConfig').AppConfig.IdealSpacesURL + 'API/Projects/' + req.body.projectid + '/Collaborators';
        }
        var collaborator = {
            Role: "ProjectAdmin",
            TempDisplayName: req.user.GetIdealSpacesId,
            UserId: req.user.GetIdealSpacesId()
        };
        if (url) {
            var options = {
                method: 'POST',
                url: url,
                headers: {
                    'Authorization': 'Bearer ' + req.user['bearerToken'],
                    'content-type': 'application/json'
                },
                body: JSON.stringify({collaborator: collaborator, email: null})
            };
            request(options, function (err, response, body) {
                if (response && response.statusCode === 200) {
                    res.end(JSON.stringify(req.app.get('Locale')("msg.projectaddedself")));
                } else {
                    try {
                        var error = new Error(JSON.parse(body)["Message"]);
                        error.status = response.statusCode;
                        next(error);
                    } catch (e) {
                        if (err) {
                            next(err);
                        } else {
                            next(e);
                        }
                    }
                }
            });
        }
    });
    router.post('/SearchProject',API.FindUsers, function (req, res, next) {
        var baseurl = req.app.get('CustomConfig').AppConfig.IdealSpacesURL;
        var userParams = {"isLimited": !(req.user.HasPermission("SearchAllStores")), "StoreID": req.user.GetStoreID()};
        var collaborators = (req.body.userInfo)?req.SearchResults.Users:[];
        var query = makeQueryText(req.body,collaborators, userParams);
        var uri = 'ProjectSearchResults';
        var url = baseurl + API2link + uri;
        console.log(url);
        var options = {
            method: 'POST',
            url: url,
            headers: {
                'Authorization': 'Bearer ' + req.user['bearerToken'],
                'content-type': 'application/json'
            },
            body: JSON.stringify({query: query})
        };
        request(options, function (err, response, body) {
            if (response && response.statusCode === 200) {
                try {
                    var results = JSON.parse(body)["Results"].map(function (project) {
                        if (project.hasOwnProperty("imgUrl_s")) {
                            project.imgUrl_s = req.app.get('CustomConfig').AppConfig.ProjectThumbnailsURL + project.imgUrl_s;
                        }
                        if (project.hasOwnProperty("prjId_s")) {
                            project.projectLink = baseurl + 'apps/idealspaces/#projects/' + project.prjId_s;
                            //projet.projetAddSelfLink = baseurl +'API/Projects/'+project.prjId_s;+'/Collaborators';
                        }
                        return project;
                    });
                    if (results.length > 0) {
                        res.render('projectsTable', { projects:results,Locale:req.app.get('Locale')});
                    } else {
                        var error = new Error(req.app.get('Locale')('msg.noprojectsfound'));
                        error.status = 400;
                        next(error)
                    }
                } catch (e) {
                    next(e);
                }
            } else {
                try {
                    var error = new Error(JSON.parse(body)["Message"]);
                    error.status = response.statusCode;
                    next(error);
                } catch (e) {
                    if (err) {
                        next(err);
                    } else {
                        next(e);
                    }
                }
            }
        });
    });
    router.get('/myprojects', function (req, res, next) {
        var baseurl = req.app.get('CustomConfig').AppConfig.IdealSpacesURL;
        var uri = 'Users/' + req.user.GetIdealSpacesId() + '/Projects';
        var query = "?query=NOT name_s_lower:c74239f5\\-db2a\\-4571\\-8a0a\\-9d7ad71ac721 AND collabs_ss:ProjectOwner\\:" + req.user.GetIdealSpacesId();
        var url = baseurl + API2link + uri + query;
        var options = {
            url: url,
            headers: {
                'Authorization': 'Bearer ' + req.user['bearerToken']
            }
        };
        request(options, function (err, response, body) {
            if (response && response.statusCode === 200) {
                try {
                    var results = JSON.parse(body)["Results"].map(function (project) {
                        if (project.hasOwnProperty("imgUrl_s")) {
                            project.imgUrl_s = req.app.get('CustomConfig').AppConfig.ProjectThumbnailsURL + project.imgUrl_s;
                        }
                        if (project.hasOwnProperty("prjId_s")) {
                            project.projectLink = baseurl + 'apps/idealspaces/#projects/' + project.prjId_s;
                        }
                        return project;
                    });

                    req.userProjects = (results);

                    var query = "?query=NOT name_s_lower:c74239f5\\-db2a\\-4571\\-8a0a\\-9d7ad71ac721 AND collabs_ss:*" + req.user.GetIdealSpacesId() + "*" + " AND NOT collabs_ss:ProjectOwner\\:" + req.user.GetIdealSpacesId();
                    var url = baseurl + API2link + uri + query;
                    var options = {
                        url: url,
                        headers: {
                            'Authorization': 'Bearer ' + req.user['bearerToken']
                        }
                    };
                    request(options, function (err, response, body) {
                        if (response && response.statusCode === 200) {
                            try {
                                var results = JSON.parse(body)["Results"].map(function (project) {
                                    if (project.hasOwnProperty("imgUrl_s")) {
                                        project.imgUrl_s = req.app.get('CustomConfig').AppConfig.ProjectThumbnailsURL + project.imgUrl_s;
                                    }
                                    if (project.hasOwnProperty("prjId_s")) {
                                        project.projectLink = baseurl + 'apps/idealspaces/#projects/' + project.prjId_s;
                                    }
                                    return project;
                                });
                                req.userProjectsCollab = (results);
                                next();
                            } catch (e) {
                                next(e);
                            }
                        } else {
                            try {
                                var error = new Error(JSON.parse(body)["Message"]);
                                error.status = response.statusCode;
                                next(error);
                            } catch (e) {
                                if (err) {
                                    next(err);
                                } else {
                                    next(e);
                                }
                            }
                        }
                    });
                } catch (e) {
                    next(e);
                }
            } else {
                try {
                    var error = new Error(JSON.parse(body)["Message"]);
                    error.status = response.statusCode;
                    next(error);
                } catch (e) {
                    if (err) {
                        next(err);
                    } else {
                        next(e);
                    }
                }
            }

        });
    });
    router.get('/projects/:uname', function (req, res, next) {
        var baseurl = req.app.get('CustomConfig').AppConfig.IdealSpacesURL;
        var query = "NOT name_s_lower:c74239f5\\-db2a\\-4571\\-8a0a\\-9d7ad71ac721 AND collabs_ss:ProjectOwner\\:" + req['userFetched'].GetIdealSpacesId();
        var uri = 'ProjectSearchResults';
        var url = baseurl + API2link + uri;
        var options = {
            method: 'POST',
            url: url,
            headers: {
                'Authorization': 'Bearer ' + req.user['bearerToken'],
                'content-type': 'application/json'
            },
            body: JSON.stringify({query: query})
        };
        request(options, function (err, response, body) {
            if (response && response.statusCode === 200) {
                try {
                    var results = JSON.parse(body)["Results"].map(function (project) {
                        if (project.hasOwnProperty("imgUrl_s")) {
                            project.imgUrl_s = req.app.get('CustomConfig').AppConfig.ProjectThumbnailsURL + project.imgUrl_s;
                        }
                        if (project.hasOwnProperty("prjId_s")) {
                            project.projectLink = baseurl + 'apps/idealspaces/#projects/' + project.prjId_s;
                        }
                        return project;
                    });
                    req.userProjects = (results);

                    var query = "NOT name_s_lower:c74239f5\\-db2a\\-4571\\-8a0a\\-9d7ad71ac721 AND collabs_ss:*" + req['userFetched'].GetIdealSpacesId() + "*" + " AND NOT collabs_ss:ProjectOwner\\:" + req['userFetched'].GetIdealSpacesId();
                    var options = {
                        method: 'POST',
                        url: url,
                        headers: {
                            'Authorization': 'Bearer ' + req.user['bearerToken'],
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({query: query})
                    };
                    request(options, function (err, response, body) {
                        if (response && response.statusCode === 200) {
                            try {
                                var results = JSON.parse(body)["Results"].map(function (project) {
                                    if (project.hasOwnProperty("imgUrl_s")) {
                                        project.imgUrl_s = req.app.get('CustomConfig').AppConfig.ProjectThumbnailsURL + project.imgUrl_s;
                                    }
                                    if (project.hasOwnProperty("prjId_s")) {
                                        project.projectLink = baseurl + 'apps/idealspaces/#projects/' + project.prjId_s;
                                    }
                                    return project;
                                });
                                req.userProjectsCollab = (results);
                                next();
                            } catch (e) {
                                next(e);
                            }
                        } else {
                            try {
                                var error = new Error(JSON.parse(body)["Message"]);
                                error.status = response.statusCode;
                                next(error);
                            } catch (e) {
                                if (err) {
                                    next(err);
                                } else {
                                    next(e);
                                }
                            }
                        }
                    });
                } catch (e) {
                    next(e)
                }
            } else {
                try {
                    var error = new Error(JSON.parse(body)["Message"]);
                    error.status = response.statusCode;
                    next(error);
                } catch (e) {
                    if (err) {
                        next(err);
                    } else {
                        next(e);
                    }
                }
            }
        });
    });
    return router;
}

//todo Retrieve users that have created projects over a period of time.
module.exports = LoadRouter;
