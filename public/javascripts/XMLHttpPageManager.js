

function LoadPage(path,method){
    method = method||"GET";
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = XMLHttpErrorHandler({
        onSuccess:function(responseText){
            // localize the page
            document.body.parentElement.innerHTML = responseText;
            ScriptOrder.LoadPageScripts(path)
        },
        onClientError:function(responseText){
            document.body.parentElement.innerHTML = responseText;
            setTimeout(function(){
                window.location.href = '/';
            },5000);
        },
        onServerError:function(responseText){
            document.body.parentElement.innerHTML = responseText;
        }
    });
    xhttp.open(method, path, true);
    if(localStorage.getItem('accessToken')){
        xhttp.setRequestHeader("Authorization","Bearer "+localStorage.getItem('accessToken'));
    }
    if(localStorage.getItem('refreshToken')){
        xhttp.setRequestHeader("RefreshToken","Refresh "+localStorage.getItem('refreshToken'));
    }
    xhttp.send();
}