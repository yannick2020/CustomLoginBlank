
//Function that fetches all roles for autocomplete tag search
var EditUser = {
    LoadURLs:['/user/edit','/myprofile/editprofile'],
    Load:function() {
        var roleInput = $('#'+$.escapeSelector(roleKey));
        roleInput.magicSuggest({
            data: "/API/GetRoles",
            beforeSend: function(xhr, settings) {
                if(localStorage.getItem('accessToken')){
                    xhr.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
                }
            },
            allowFreeEntries: false,
            cls:'roleInput'
        });
        document.getElementById('ZipCode').addEventListener("keydown",ValidateInput);
        document.getElementById('ZipCode').addEventListener("input",GetStores);
    },
    UpdateUser:function(){
        var inputs = document.getElementsByClassName("inputfield");
        var parameters = {};
        for(var i=0;i<inputs.length;i++){
            parameters[inputs[i].name] = inputs[i].value;
        }
        if(document.getElementById(roleKey)){
            parameters[roleKey] = $('#'+$.escapeSelector(roleKey)).magicSuggest({}).getValue().toString();
        }
        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = XMLHttpErrorHandler({
            onSuccess:function (responseText) {
                alert(responseText);
                window.location.reload();
            }
        });
        xhttp.open("PUT", window.location.pathname, true);
        if(localStorage.getItem('accessToken')){
            xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
        }
        if(localStorage.getItem('refreshToken')){
            xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
        }
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(parameters));

    },
    DeleteUser:function(event){
        if(confirm(event.attributes.confirmation.value)){
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = XMLHttpErrorHandler({
                onSuccess:function (responseText) {
                    alert(responseText);
                    window.location.reload();
                }
            });
            xhttp.open("DELETE", window.location.pathname, true);
            if(localStorage.getItem('accessToken')){
                xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
            }
            if(localStorage.getItem('refreshToken')){
                xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
            }
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send();
        }
    }
};
var SearchProject = {
    LoadURLs:['/user/edit'],
    Rechercher:function(){
        document.getElementById('results').innerHTML = '<img src="/images/loader_smallSpinner.gif">';
        var self = this;
        var baseURL = '/isAPI';
        //add token? +"&token="+token
        var inputs = document.getElementsByClassName("inputfield");
        var parameters = {};
        for(var i=0;i<inputs.length;i++){
            if(inputs[i].type === "checkbox"){
                parameters[inputs[i].id] = inputs[i].checked;
            }else {
                parameters[inputs[i].id] = inputs[i].value;
            }
        }
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = XMLHttpErrorHandler({
            onSuccess:function(responseText){
                var projects = (responseText);
                var result = [];
                if(Array.isArray(projects)) {
                    for (i = 0; i < projects.length; i++) {
                        if (projects[i].hasOwnProperty('name_s_lower')) {
                            result.push(projects[i]);
                        }
                    }
                }else{
                    result = responseText;
                }
                self.PopulateResults(result);
            },
            onClientError:function(responseText){
                document.getElementById('results').innerHTML = '<h2>'+responseText+'</h2>';
            }
        });
        xhttp.open("POST", baseURL + "/SearchProject", true);
        if(localStorage.getItem('accessToken')){
            xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
        }
        if(localStorage.getItem('refreshToken')){
            xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
        }
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify(parameters));
    },
    PopulateResults:function(result){
        var self = this;
        //wth is this, this is disgusting
        document.getElementById('results').innerHTML = '';
        if(Array.isArray(result) && result.length>0) {
            for (i = 0; i < result.length; i++) {
                var project = result[i];
                var ProjectNameHTML = '<h3>' + project.name_s_lower + '</h3>';
                var ProjectImageHTML = '<a href="' + project.projectLink + '" onclick="SearchProject.AddSelf(\'' + project.prjId_s + '\')" target="_blank"><div class="thumbnail" style="background-image: url(' + project.imgUrl_s + '),url(/images/notfound.jpg)"></div>' + ProjectNameHTML + '</a>';
                var AddSelfLink = '<div class="button" onclick="SearchProject.AddSelf(\'' + project.prjId_s + '\')">AddSelf</div>';
                var htmlText = '<figure class="gridItem">' + ProjectImageHTML + '</figure>';
                var keys = Object.keys(result[i]);
                var text = '';
                var projectID = "";
                for (j = 0; j < keys.length; j++) {
                    if (keys[j] === 'prjId_s') {
                        projectID = result[i][keys[j]];
                    }
                    text += keys[j] + ': ' + result[i][keys[j]] + '<br/>';
                }
                document.getElementById('results').innerHTML += htmlText;
                //document.getElementById('results').innerHTML += '<div onclick="addSelf(\''+projectID+'\')">AddSelf</div>';
            }
        }else{
            document.getElementById('results').innerHTML += result;
        }
    },
    AddSelf:function(projectID){
        var parameters = {"projectid":projectID};
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = XMLHttpErrorHandler({
            onSuccess:function(responseText){
                alert(responseText);
            }
        });
        xhttp.open("POST", '/isAPI' + "/AddSelf", true);
        if(localStorage.getItem('accessToken')){
            xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
        }
        if(localStorage.getItem('refreshToken')){
            xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
        }
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify(parameters));
    }
};
var SearchUsers = {
    pagination:[""],
    page:0,
    baseURL:'/API',
    Rechercher:function (){
        document.getElementById('results').innerHTML = '<img src="/images/loader_smallSpinner.gif">';
        SearchUsers.page = 0;
        SearchUsers.pagination = [""];
        var userinfo = document.getElementById("unserinfo").value;
        document.getElementById("currentSearch").value = userinfo;
        var querey = {};
        querey.userInfo = userinfo;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = XMLHttpErrorHandler({
            onSuccess:function(responseText){
                var results = (responseText);
                var users = results.Users;
                if(xhttp.getResponseHeader('PaginationToken')) {
                    SearchUsers.pagination[SearchUsers.page+1] = (xhttp.getResponseHeader('PaginationToken'));
                }
                SearchUsers.PopulateResults(responseText);
            },
            onClientError:function(responseText){
                document.getElementById('results').innerHTML = responseText;
            }
        });
        xhttp.open("POST", this.baseURL + "/FindUsers", true);
        if(localStorage.getItem('accessToken')){
            xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
        }
        if(localStorage.getItem('refreshToken')){
            xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
        }
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(querey));
    },
    PopulateResults:function (result){
        document.getElementById('results').innerHTML = '';
        if(result && result.length!==0) {
            var keys = Object.keys(result[0]);
            var tableHTML = '';
            for (i = 0; i < result.length; i++) {
                 tableHTML+= '<tr><th rowspan="2">'+(i+1)+'</th><td>' + '<a href="/user/profile/' + result[i][keys[0]] + '">'+ result[i][keys[0]] + '</a>' + '</td></tr><tr><td>' + result[i][keys[1]] + "</td></tr>";
            }
            document.getElementById('results').innerHTML =result;
            if(SearchUsers.pagination[(SearchUsers.page - 1)] !== undefined){
                if(document.getElementById('PrevPageBtn')){
                    document.getElementById('PrevPageBtn').classList.remove('inactive');
                    document.getElementById('PrevPageBtn').setAttribute('onclick','SearchUsers.NextPage(SearchUsers.pagination[--SearchUsers.page])')
                }
            }
            if(SearchUsers.pagination[(SearchUsers.page + 1)]){
                if(document.getElementById('NextPageBtn')){
                    document.getElementById('NextPageBtn').classList.remove('inactive');
                    document.getElementById('NextPageBtn').setAttribute('onclick','SearchUsers.NextPage(SearchUsers.pagination[++SearchUsers.page])')
                }
            }
        }
    },
    NextPage:function (paginationToken){
        document.getElementById('results').innerHTML = '<img src="/images/loader_smallSpinner.gif">';
        var userinfo = document.getElementById("currentSearch").value;
        var querey = {userInfo:userinfo};
        if(paginationToken){
            querey.PaginationToken = paginationToken
        }
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = XMLHttpErrorHandler({
            onSuccess:function(responseText){
                var results = (responseText);
                var users = results.Users;
                if(xhttp.getResponseHeader('PaginationToken')) {
                    SearchUsers.pagination[SearchUsers.page+1] = (xhttp.getResponseHeader('PaginationToken'));
                }
                SearchUsers.PopulateResults(responseText);
            }
        });
        xhttp.open("POST", this.baseURL + "/FindUsers", true);
        if(localStorage.getItem('accessToken')){
            xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
        }
        if(localStorage.getItem('refreshToken')){
            xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
        }
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(querey));
    }
};
var StatisticsQuery = {
    LoadURLs:['/statistics'],
    Load:function(){
        var baseURL = "/statistics";
        var self = this;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = XMLHttpErrorHandler({
            onSuccess:function(responseText){
                document.getElementById('Refresh').setAttribute('onclick',"StatisticsQuery.Refresh()");
                document.getElementById('Refresh').setAttribute('class',"button active");

                document.getElementById('DesignerStats').setAttribute('onclick',"StatisticsQuery.GetStats('/GetDesignerNumber','StoreStatsQuery')");
                document.getElementById('DesignerStats').setAttribute('class',"button active");

                document.getElementById('UserStats').setAttribute('onclick',"StatisticsQuery.GetStats('/GetUserNumber','UserStatsQuery')");
                document.getElementById('UserStats').setAttribute('class',"button active");

                document.getElementById('results').innerHTML = '<h2>'+responseText+'</h2>';
            },
            onServerError:function(responseText){
                document.getElementById('results').innerHTML = '<h2>'+responseText+'</h2>';


            }
        });
        xhttp.open("POST", baseURL + "/GetStatus", true);
        if(localStorage.getItem('accessToken')){
            xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
        }
        if(localStorage.getItem('refreshToken')){
            xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
        }
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send();
    },
    PopulateQuery:function(result){
        //wth is this, this is disgusting
        document.getElementById('results').innerHTML = '';
        var blob = new Blob(["\uFEFF"+result], {type: 'text/csv',encoding:"UTF-8"});
        var a = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);
        a.href = window.URL.createObjectURL(blob);
        a.download = 'Statistics.csv';
        a.click();
        window.URL.revokeObjectURL(a);
    },
    Refresh:function(){
        document.getElementById('Refresh').removeAttribute('onclick');
        document.getElementById('Refresh').setAttribute('class',"button inactive");

        document.getElementById('DesignerStats').removeAttribute('onclick');
        document.getElementById('DesignerStats').setAttribute('class',"button inactive");

        var baseURL = "/statistics";
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = XMLHttpErrorHandler({
            onSuccess:function (responseText) {
                alert(responseText);
                window.location.reload();
            }
        });
        xhttp.open("POST", baseURL + "/RefreshUserList", true);
        if(localStorage.getItem('accessToken')){
            xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
        }
        if(localStorage.getItem('refreshToken')){
            xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
        }
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send();

    },
    GetStats:function(link,classname){
        document.getElementById('results').innerHTML = '<img src="/images/loader_smallSpinner.gif">';
        document.getElementById('Refresh').removeAttribute('onclick');
        document.getElementById('Refresh').setAttribute('class',"button inactive");

        document.getElementById('DesignerStats').removeAttribute('onclick');
        document.getElementById('DesignerStats').setAttribute('class',"button inactive");

        document.getElementById('UserStats').removeAttribute('onclick');
        document.getElementById('UserStats').setAttribute('class',"button inactive");

        var baseURL = "/statistics";
        var self = this;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = XMLHttpErrorHandler({
            onSuccess:function(responseText){
                document.getElementById('Refresh').setAttribute('onclick',"StatisticsQuery.Refresh()");
                document.getElementById('Refresh').setAttribute('class',"button active");

                document.getElementById('DesignerStats').setAttribute('onclick',"StatisticsQuery.GetStats('/GetDesignerNumber','StoreStatsQuery')");
                document.getElementById('DesignerStats').setAttribute('class',"button active");

                document.getElementById('UserStats').setAttribute('onclick',"StatisticsQuery.GetStats('/GetUserNumber','UserStatsQuery')");
                document.getElementById('UserStats').setAttribute('class',"button active");
                StatisticsQuery.PopulateQuery(responseText);
            },
            onServerError:function(responseText){
                document.getElementById('results').innerHTML = '<h2>'+responseText+'</h2>';
            }
        });
        var query={};
        console.log(classname);
        var queryDoc = document.getElementsByClassName(classname);
        console.log(queryDoc);
        for(i=0;i<queryDoc.length;i++){
            query[queryDoc[i].name] =queryDoc[i].value;
        }
        console.log(query);
        xhttp.open("POST", baseURL + link, true);
        if(localStorage.getItem('accessToken')){
            xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
        }
        if(localStorage.getItem('refreshToken')){
            xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
        }
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify(query));
    },
    DropdownMenu:function(event,documentId){
        if(event.target.hasAttribute('toggled')){
            event.target.removeAttribute('toggled','');
            event.target.innerHTML =event.target.innerHTML.replace('-','+');
            document.getElementById(documentId).setAttribute('style','display:none;');
        }else{
            event.target.setAttribute('toggled','');
            event.target.innerHTML =event.target.innerHTML.replace('+','-');
            document.getElementById(documentId).removeAttribute('style');
        }

    }
};

var i=0;

for(i=0;i<StatisticsQuery.LoadURLs.length;i++) {
    if(!ScriptOrder[StatisticsQuery.LoadURLs[i]]){
        ScriptOrder[StatisticsQuery.LoadURLs[i]] = [];
    }
    ScriptOrder[StatisticsQuery.LoadURLs[i]].push(StatisticsQuery.Load);
}
for(i=0;i<SearchProject.LoadURLs.length;i++) {
    if(!ScriptOrder[SearchProject.LoadURLs[i]]){
        ScriptOrder[SearchProject.LoadURLs[i]] = [];
    }
    ScriptOrder[SearchProject.LoadURLs[i]].push(SearchProject.Load);
}
for(i=0;i<EditUser.LoadURLs.length;i++) {
    if(!ScriptOrder[EditUser.LoadURLs[i]]){
        ScriptOrder[EditUser.LoadURLs[i]] = [];
    }
    ScriptOrder[EditUser.LoadURLs[i]].push(EditUser.Load);
}

ScriptOrder["Final"].push(function(){
    document.getElementById("content").style = "display:block";
    document.getElementById("Loader").style = "display:none";
});

function globalLogout(event){
    if(confirm(event.attributes.confirmation.value)){
        LoadPage('/logout/global') ;
    }
}

function GetStores(e){
    if(e.target.value.length ===5){
        if(document.getElementById('Loading')){
            document.getElementById('Loading').remove();
        }
        var spinner = new Image();
        spinner.src = "/images/loader_smallSpinner.gif";
        spinner.style="display:inline-block";
        spinner.id = "Loading";
        e.target.parentElement.append(spinner);
        document.getElementById('StoreField').innerHTML='';
        console.log('Getting zipcodes');
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = XMLHttpErrorHandler({
            onSuccess:function(responseText){
                document.getElementById('Loading').remove();
                document.getElementById('StoreField').disabled = false;
                var i;
                for(i=0;i<responseText.length;i++){
                    document.getElementById('StoreField').append(new Option(responseText[i].Name,responseText[i].Value));
                }
            },
            onClientError:function(responseText){
                alert(responseText);
                document.getElementById('Loading').remove();
            },
            onServerError:function(responseText){
                alert(responseText);
                document.getElementById('Loading').remove();
            }
        });
        xhttp.open("POST", '/API/GetStores', true);
        if(localStorage.getItem('accessToken')){
            xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
        }
        if(localStorage.getItem('refreshToken')){
            xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
        }
        xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp.send(JSON.stringify({zipcode:e.target.value}));
    }
}
function ValidateInput(e) {
    if(!((e.which >= 48 && e.which <= 57) || (e.which >= 96 && e.which <= 105) ||(e.which ===8)||e.which ===46)){
        event.preventDefault();
    }
}
function toggleMenu(){
    if(document.getElementById('tablinks')){
        document.getElementById('headermenu').classList.toggle('toggled');
    }
}
function toggleUserInfo(index){
    if(document.getElementsByClassName('user'+index)){
        var userinfo = document.getElementsByClassName('user'+index);
        for(i=0;i<userinfo.length;i++){
            userinfo[i].classList.toggle('toggled');
        }
    }
}

window.onload = ScriptOrder.LoadPageScripts('/');