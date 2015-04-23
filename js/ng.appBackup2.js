(function () {
    /*creating app (currently adding coockies and route)*/
    var app = angular.module('app', ['ngCookies', 'ngRoute']);

    /*"URLBASE": "http://localhost.fc.local/Fmf2Services/api",*/
    app.constant("CONFIG", {
        "TEXT": {
            "ERROR": "Something went wrong...",
            "SUCCESS": "Hurray it worked!"
        },
        "URLS": {
            "BASE": "/google/api/XXX"
        },
        "LINKS": [
	        {
	            "title": "Inbox",
	            "name": "inbox",
	            "url": "#inbox",
	            "disabled": false
	        },
	        {
	            "title": "Sent",
	            "name": "sent",
	            "url": "#sent",
	            "disabled": false
	        },
	        {
	            "title": "Spam",
	            "name": "spam",
	            "url": "#spam",
	            "disabled": false
	        }
        ]
    });

    /*configuring http requests */
    app.config(function ($httpProvider) {
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.interceptors.push('httpRequestInterceptor');
    });

    /*loading-spinner http Requests Interceptor */
    app.factory('httpRequestInterceptor', function ($q, $timeout) {
        var interceptor = {
            'request': function (config) {
                $('#loading-spinner').stop().fadeIn('100');
                return config; //show loader and create request (loader showing has built in delay to avoid showing it when not needed)
            },
            'response': function (response) {
                $('#loading-spinner').stop().fadeOut('100');
                return response; // hide loader and return response
            },
            'requestError': function (rejection) {
                return response; // error handling
            },
            'responseError': function (rejection) {
                return rejection; // error handling
            }
        };
        return interceptor;
    });

    /*configuring route provider (views)*/
    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
        when('/emails', {
            templateUrl: 'views/emails/index.html',
            controller: 'emailsController'
        }).
        when('/email', {
            templateUrl: 'views/email/index.html',
            controller: 'singleEmailController'
        }).
        when('/home', {
            templateUrl: 'views/index.html',
            controller: 'homeController'
        }).
        otherwise({
            redirectTo: '/home'
        });
    }]);

    /*configuring data service for bindings*/
    app.factory('dataFactory', ['CONFIG', '$cookies', '$http', function (CONFIG, $cookies, $http) {
        var dataFactory = {};

        /*--- getters and setters for data User GUID ---*/
        dataFactory.getDataUserGuid = function () {
            return dataUserGuid;
        };
        dataFactory.setDataUserGuid = function (user) {
            dataUserGuid = user;
        };
        /*--- getData ---*/
        dataFactory.getData = function () {
            return $http.get(dataFactory.buildQuery());
        };

        /*--- deleteData ---*/
        dataFactory.deleteData = function () {
            return $http.delete(dataFactory.buildQuery());
        };

        /*--- postData (using built URL + built Params) ---*/
        dataFactory.postData = function (url, params) {
            console.log("im in the datafactory got this as URL: " + url);
            url = dataFactory.buildUrl(url);
            if (params != undefined) {
                //params = dataFactory.buildParams(params);
                console.log("DATAFACTORY- API(p): " + url + ", " + params);
                return $http.post(url , params);
            } else {
                //currently should only be used by SSO
                var validateSsoReq = {
                    "Token": fcssoCookie,
                    "SetCookie": true,
                };

                console.log("DATAFACTORY- API(p-SSO): " + url + ", " + validateSsoReq);
                return $http.post(url, validateSsoReq);
            }
        };

        return dataFactory;
    }]);

    /*configuring data service for bindings*/
    app.factory("flash", function ($rootScope, $timeout) {
        var queue = [];
        var messageDelay = 500;
        var initialDelay = 500;
        var currentMessage = "";

        //consumeQueue();
        function consumeQueue() {
            console.log("consumeQueue triggered");
            $timeout(function () {
                while (queue.length > 0) {
                    currentMessage = queue.shift();
                    console.log("currentMessage : " + $rootScope.currentMessage + " | queue.length : " + queue.length);
                    consumeQueue();
                }
            }, messageDelay);
        }

        return {
            setMessage: function (message) {
                queue.push(message);
                console.log("queue.length : " + queue.length);
                $timeout(function () {
                    //$rootScope.currentMessage = queue.pop();
                    consumeQueue();
                }, initialDelay);
            },
            getMessage: function () {
                return currentMessage;
            }
        };
    });

    /*navigation (list of links in bottom) + SSO Validation call*/
    app.controller("NavController", ['CONFIG', '$scope', 'dataFactory', function (CONFIG, $scope, dataFactory) {
        this.links = CONFIG.LINKS;

        this.isSet = function (link) {
            return this.link === link;
        };

        this.navClick = function (link) {
            this.link = link;
            dataFactory.setSelectedId("");
        };
    }]);

    /*main controller (general table row selection + displaying messages)*/
    app.controller("mainController", ['$scope', 'flash', '$location', 'dataFactory', function ($scope, flash, $location, dataFactory) {
        $scope.signedIn = false;
        $scope.email = null;
        $scope.displayName = null;

        // Button "go" (navigate to a single entity page)
        $scope.go = function (path, params) {
            if (params != undefined && params == "clearSelected") {
                dataFactory.setSelectedId(null);
                $scope.selectedIndex = null;
                $scope.selectedId = null;
                console.log("selectedId should now be null: " + dataFactory.getSelectedId())
            }
            console.log("MAINCONTROLLER.go(): " + path + "/" + dataFactory.getSelectedId());
            $location.path(path);
        };

        //Google sign in
        $scope.processAuth = function(authResult) {
            if(authResult['access_token']) {
                $scope.signedIn = true;
                console.log('logged in - ' + authResult['access_token']);
                //$scope.getUserInfo();

            } else if(authResult['error']) {
                $scope.signedIn = false;
                console.log('logged out');
            }
        };

        // When callback is received, we need to process authentication.
        $scope.signInCallback = function(authResult) {
            $scope.$apply(function() {
                $scope.processAuth(authResult);
            });
        };

        // Render the sign in button.
        $scope.init = function() {
            gapi.client.setApiKey('AIzaSyA6TsGjSNES_Mk_yn07No8NMy5Z74nJo3o');
            gapi.signin.render('signInButton',
                {
                    'callback': $scope.signInCallback,
                    'clientid': '751944076427-vqqieir1dit5gko8e9fffc51ttqt8fnd.apps.googleusercontent.com',
                    'requestvisibleactions': 'http://schemas.google.com/AddActivity',
                    'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://mail.google.com/',
                    'cookiepolicy': 'single_host_origin'
                }
            );
        }


        $scope.init();


        $scope.getUserInfo = function(){
            res = '';
            gapi.client.load('plus', 'v1').then(function() {
                var request = gapi.client.plus.people.get({
                    'userId': 'me'
                });
                request.then(function(response) {
                    console.log(response.result);
                    $scope.email = response.result.emails[0].value;
                    $scope.displayName = response.result.displayName;
                    console.log('email is - ' + $scope.email );
                    console.log('name is - ' + $scope.displayName);
                }, function(reason) {
                    console.log('Error: ' + reason.result.error.message);
                });
            });
        };

    }]);

    /*fields controller*/
    app.controller('emailsController', ['$scope', 'flash', 'dataFactory', function ($scope, flash, dataFactory) {



    }]);

    /*single field controller (new,edit & delete )*/
    app.controller('singleEmailController', ['$scope', 'flash', 'dataFactory', function ($scope, flash, dataFactory) {



    }]);

    /*home controller*/
    app.controller('homeController', ['$scope', 'flash', 'dataFactory', function ($scope, flash, dataFactory) {



    }]);


    /*initialize bootstrap*/
    angular.element(document).ready(function () {
        angular.bootstrap(document, ['app']);
    });
})();