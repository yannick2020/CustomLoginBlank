
function XMLHttpErrorHandler(callbacks) {

    return function() {
        var onInformal, onSuccess, onRedirect, onClientError, onServerError;
        if (callbacks) {
            onInformal = (callbacks.onInformal || console.log);
            onSuccess = (callbacks.onSuccess || alert);
            onRedirect = (callbacks.onRedirect || console.log);

            onClientError = (callbacks.onClientError || alert);
            onServerError = (callbacks.onServerError || alert);
        } else {
            onInformal = onSuccess = onRedirect = onClientError = onServerError = console.log;
        }
        if(this.getResponseHeader("Location")){
            window.location.href = this.getResponseHeader("Location");
        }
        if (this.readyState === 4) {
            if (this.getResponseHeader("AccessToken") && this.getResponseHeader("AccessToken") !== localStorage.getItem('accessToken')) {
                localStorage.setItem('accessToken', this.getResponseHeader("AccessToken"));
                console.log('Token Renewed');
            }
            if (this.getResponseHeader("RefreshToken") && this.getResponseHeader("AccessToken") !== localStorage.getItem('refreshToken')) {
                localStorage.setItem('refreshToken', this.getResponseHeader("RefreshToken"));
            }

            var responseObject = this.responseText;
            try {
                responseObject = JSON.parse(this.responseText);
            } catch (e) {
            }

            if (this.status >= 100 && this.status < 200) {
                onInformal(responseObject)
            } else if (this.status >= 200 && this.status < 300) {
                onSuccess(responseObject)
            } else if (this.status >= 300 && this.status < 400) {
                onRedirect(responseObject);
            } else if (this.status >= 400 && this.status < 500) {
                if (this.status === 401) {
                    localStorage.clear();
                    window.location.href = '/login'+window.location.search;
                } else {
                    onClientError(responseObject);
                }
            } else if (this.status >= 500) {
                onServerError(responseObject);
            }
        }
    };

}