if(window.location.search){
    var paratersArray = window.location.search.split('?')[1].split('&');
    var URLparameters = {};
    var i;
    for(i=0;i<paratersArray.length;i++){
        URLparameters[paratersArray[i].split('=')[0]] =paratersArray[i].split('=')[1];
    }
}
// Function that signs the user in.
function submit() {
    var inputs = document.getElementsByClassName("FormField");
    var parameters = {};
    for(var i=0;i<inputs.length;i++){
        parameters[inputs[i].name] = inputs[i].value;
    }
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = XMLHttpErrorHandler({
        onSuccess:function (responseText) {
            if((responseText).AccessToken){
                localStorage.setItem('accessToken',(responseText).AccessToken);
                if((responseText).RefreshToken){
                    localStorage.setItem('refreshToken',(responseText).RefreshToken);
                }
            }
            if((responseText).redirectURL){
                window.location.href = ((responseText).redirectURL);
            }else if(URLparameters && URLparameters.hasOwnProperty('redirectURL') &&localStorage.getItem('accessToken')){
                window.location.href = (URLparameters.redirectURL + '?token=' + localStorage.getItem('accessToken') + '&isAuth=true');
            }else{
                window.location.href = ('/');
            }
        }
    });
    xhttp.open("POST", (window.location.pathname+ window.location.search) );
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify(parameters));
}
function checkKey(event){
    if (event.keyCode === 13) {
        authenticate();
    }
}