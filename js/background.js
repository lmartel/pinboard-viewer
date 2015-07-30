// {url: {title, desc, tag, time, isSaved, isSaving}}
var pages = {}, _userInfo;

var makeBasicAuthHeader = function(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return "Basic " + hash;
};

var makeUserAuthHeader = function() {
    var userInfo = getUserInfo();
    return makeBasicAuthHeader(userInfo.name, userInfo.pwd);
};

var logout = function () {
    _userInfo.isChecked = false;
    localStorage.removeItem(checkedkey);
    localStorage.removeItem(namekey);
    localStorage.removeItem(pwdkey);
    localStorage.removeItem(authTokenKey);
    var popup = chrome.extension.getViews({type: 'popup'})[0];
    popup && popup.$rootScope &&
        popup.$rootScope.$broadcast('logged-out');
};

var getUserInfo = function () {
    if (!_userInfo) {
        if (localStorage[checkedkey]) {
            _userInfo = {isChecked: localStorage[checkedkey],
                         authToken: localStorage[authTokenKey],
                         name: localStorage[namekey],
                         pwd: localStorage[pwdkey]};
        } else {
            _userInfo = {isChecked: false, authToken: '',
                         name: '', pwd: ''};
        }
    }
    return _userInfo;
};

var login = function (token) {
    // test auth
    var path = mainPath + 'user/api_token',
        popup = chrome.extension.getViews({type: 'popup'})[0],
        jqxhr = $.ajax({url: path,
                        data: {format:'json', auth_token: token},
                        type : 'GET',
                        timeout: REQ_TIME_OUT,
                        dataType: 'json',
                        crossDomain: true,
                        contentType:'text/plain'
                       });
    jqxhr.always(function (data) {
        if (data.result) {
            // success
            _userInfo.authToken = token;
            _userInfo.name = token.split(':')[0];
            _userInfo.isChecked = true;
            localStorage[authTokenKey] = token;
            localStorage[checkedkey] = true;
            popup && popup.$rootScope &&
                popup.$rootScope.$broadcast('login-succeed');
        } else {
            // login error
            popup && popup.$rootScope &&
                popup.$rootScope.$broadcast('login-failed');
        }
    });
    jqxhr.fail(function (data) {
        if (data.statusText == 'timeout') {
            popup && popup.$rootScope &&
                popup.$rootScope.$broadcast('login-failed');
        }
    });
};
