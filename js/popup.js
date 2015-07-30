var app = angular.module('popupApp', []);

app.controller(
    'PopupCtrl',
    ['$rootScope', '$scope', '$window',
     function($rootScope, $scope, $window) {
         var bg = chrome.extension.getBackgroundPage(),
             keyCode = {enter:13, tab:9, up:38, down:40, ctrl:17, n:78, p:80, space:32},
             SEC = 1000, MIN = SEC*60, HOUR = MIN*60, DAY = HOUR*24, WEEK = DAY*7;
         Date.prototype.getTimePassed = function () {
             var ret = {day: 0, hour: 0, min: 0, sec: 0, offset: -1},
                 offset = new Date() - this, r;
             if (offset<=0) return ret;
             ret.offset = offset;
             ret.week = Math.floor(offset/WEEK); r = offset%WEEK;
             ret.day = Math.floor(offset/DAY); r = offset%DAY;
             ret.hour = Math.floor(r/HOUR); r = r%HOUR;
             ret.min = Math.floor(r/MIN); r = r%MIN;
             ret.sec = Math.floor(r/SEC);
             return ret;
         };

         $window.$rootScope = $rootScope;

         $scope.$on('login-failed', function () {
             $scope.isLoading = false;
             $scope.isLoginError = true;
             $scope.$apply();
         });

         $scope.$on('login-succeed', renderPopup);

         function renderPopup() {
             chrome.tabs.getSelected(null, function (tab) {
                 $scope.isLoading = false;
                 $scope.isAnony = false;
                 $scope.$apply();
                 if (location.search != "?focusHack") {
                     location.search = "?focusHack";
                 }
             });
         }

         $scope.$on('logged-out', function () {
             $scope.isAnony = true;
             $scope.isLoading = false;
             $scope.isLoginError = false;
             $scope.$apply();
         });

         $scope.$on('show-loading', function (e, loadingText) {
             $scope.isLoading = true;
             $scope.loadingText = loadingText || 'Loading...';
             $scope.$apply();
         });

         $scope.openUrl = function (url) {
             chrome.tabs.create({url: url});
             var popup = chrome.extension.getViews({type: 'popup'})[0];
             popup && popup.close();
         };

         $scope.renderSavedTime = function (time) {
             var passed = new Date(time).getTimePassed(),
                 dispStr = 'previously saved ',
                 w = passed.week, d = passed.day, h = passed.hour;
             if (passed.offset > WEEK) {
                 dispStr = dispStr.concat(passed.week, ' ', 'weeks ago');
             } else if (passed.offset > DAY) {
                 dispStr = dispStr.concat(passed.day, ' ', 'days ago');
             } else if (passed.offset > HOUR){
                 dispStr = dispStr.concat(passed.hour, ' ', 'hours ago');
             } else {
                 dispStr = dispStr.concat('just now');
             }
             return dispStr;
         };

         $scope.loginSubmit = function () {
             if ($scope.userLogin.authToken) {
                 $scope.loadingText = 'Logging in...';
                 $scope.isLoading = true;
                 bg.login($scope.userLogin.authToken);
             }
         };

         $scope.logout = function () {
             bg.logout();
         };

         var userInfo = bg.getUserInfo();
         $scope.userInfo = userInfo;
         $scope.isAnony = !userInfo || !userInfo.isChecked;
         $scope.isLoading = false;
         $scope.loadingText = 'Loading...';
         if ($scope.isAnony) {
             $scope.isLoginError = false;
         } else {
             renderPopup();
         }
     }]);
