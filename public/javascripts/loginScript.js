if(window.location.search){
    var paratersArray = window.location.search.split('?')[1].split('&');
    var parameters = {};
    var i;
    for(i=0;i<paratersArray.length;i++){
        parameters[paratersArray[i].split('=')[0]] =paratersArray[i].split('=')[1];
    }
    if(parameters.hasOwnProperty('voidToken') && parameters.voidToken ==="true" && localStorage.getItem('accessToken')){
        LoadPage('/logout/global');
        localStorage.clear();
        window.parent.postMessage({type:"LogoutExtAuth"},"*");
    }
}
if(localStorage.getItem('accessToken') ){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = XMLHttpErrorHandler({
        onSuccess:function(response){
            if(parameters && parameters.hasOwnProperty('redirectURL')){
                window.location.href = (parameters.redirectURL + '?token=' + localStorage.getItem('accessToken') + '&isAuth=true');
            }else{
                LoadPage(window.location.pathname);
            }
        }
    });

    xhttp.open('GET', '/', true);
    if(localStorage.getItem('accessToken')){
        xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
    }
    if(localStorage.getItem('refreshToken')){
        xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
    }
    xhttp.send();

}else{
    document.getElementById("content").style = "display:block";
    document.getElementById("Loader").style = "display:none";
}
// Function that signs the user in.
function authenticate() {
    var baseURL = '/login';
    blogin = (document.getElementById("login-form-username")).value != null && (document.getElementById("login-form-username")).value != "";
    bpwd = (document.getElementById("login-form-password")).value != null && (document.getElementById("login-form-password")).value != "";
    if (!blogin||!bpwd) return;

    var usr = (document.getElementById("login-form-username")).value;
    var pwd = (document.getElementById("login-form-password")).value;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = XMLHttpErrorHandler({
        onSuccess:function(responseText){

            localStorage.setItem('accessToken',(responseText).AccessToken);
            localStorage.setItem('refreshToken',(responseText).RefreshToken);
            if(parameters && parameters.hasOwnProperty('redirectURL')){
                window.location.href = (parameters.redirectURL + '?token=' + localStorage.getItem('accessToken') + '&isAuth=true');
            }else{
                if(window.location.pathname!=="/login") {
                    window.location.href = (window.location.pathname);
                }else{
                    window.location.href = ('/');
                }
            }
        }
    });
    xhttp.open("POST", (baseURL + window.location.search) );
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify({"username":usr,"password":pwd}));
}
function checkKey(event){
    if (event.keyCode === 13) {
        authenticate();
    }
}