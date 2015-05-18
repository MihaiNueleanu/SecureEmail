(function () {
    /*creating app (currently adding coockies and route)*/
    var app = angular.module('app', ['ngCookies', 'ngRoute']);

    app.constant("CONFIG", {
        "TEXT": {
            "ERROR": "Something went wrong...",
            "SUCCESS": "Hurray it worked!"
        },
        "LINKS": [
	        {
	            "title": "Inbox",
	            "name": "Inbox",
	            "url": "#emails",
	            "disabled": false
	        },
	        {
	            "title": "Sent",
	            "name": "sent",
	            "url": "#sent",
	            "disabled": true
	        },
	        {
	            "title": "Spam",
	            "name": "spam",
	            "url": "#spam",
	            "disabled": true
	        },
            {
                "title": "signup",
                "name": "signup",
                "url": "#signup",
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
        when('/email/:param1', {
            templateUrl: 'views/email/index.html',
            controller: 'singleEmailController'
        }).
        when('/home', {
            templateUrl: 'views/index.html',
            controller: 'mainController'
        }).
        when('/signup', {
            templateUrl: 'views/signup.html',
            controller: 'signupController'
        }).
        otherwise({
            redirectTo: '/home'
        });
    }]);

    /*configuring data service for bindings*/
    app.factory('dataFactory', ['CONFIG', '$cookies', '$http', function (CONFIG, $cookies, $http) {
        var dataFactory = {};

        return dataFactory;
    }]);

    app.factory("GPlusAuthService", function ($q, $window) {
        var GPlusAuthService = {};
        var signedIn = false;

        GPlusAuthService.signIn = function () {
            var defered = $q.defer();
            $window.signinCallback = function (response) {
                $window.signinCallback = undefined;
                defered.resolve(response);
            };

            gapi.client.setApiKey('AIzaSyA6TsGjSNES_Mk_yn07No8NMy5Z74nJo3o');

            gapi.auth.signIn({
                callback: "signinCallback",
                'clientid': '751944076427-vqqieir1dit5gko8e9fffc51ttqt8fnd.apps.googleusercontent.com',
                'requestvisibleactions': 'http://schemas.google.com/AddActivity',
                'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://mail.google.com/',
                'cookiepolicy': 'single_host_origin'
            });
            return defered.promise;
        };

        GPlusAuthService.signOut = function () {
            gapi.client.setApiKey('AIzaSyA6TsGjSNES_Mk_yn07No8NMy5Z74nJo3o');
            console.log("signing out from the factory!");
            gapi.auth.signOut();
        };

        /*--- getters and setters for the selected dataSelectedId---*/
        GPlusAuthService.isSignedIn = function () {
            return signedIn;
        };

        GPlusAuthService.setSignedIn = function (status) {
            signedIn = status;
        };

        return GPlusAuthService;
    });

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
    app.controller("NavController", ['CONFIG', '$scope', 'dataFactory', 'GPlusAuthService', function (CONFIG, $scope, dataFactory, GPlusAuthService) {
        this.links = CONFIG.LINKS;

        this.isSet = function (link) {
            return this.link === link;
        };

        this.isHidden = function () {
            if (!GPlusAuthService.isSignedIn()) {
                console.log("navigation should be hidden");
                return true;
            } else {
                console.log("navigation should be SHOWN");
            }
        };

    }]);

    /*main controller (general table row selection + displaying messages)*/
    app.controller("mainController", ['$scope', 'flash', '$location', 'dataFactory', 'GPlusAuthService','$http', function ($scope, flash, $location, dataFactory, GPlusAuthService,$http) {
        console.log("im in the main controller!");
        //$scope.signedIn = false;
        $scope.userEmail = null;
        $scope.displayName = null;
        $scope.emailBulk = null;
        $scope.emailsBatch = {};

        $scope.getUserInfo = function(){
            gapi.client.load('plus', 'v1').then(function() {
                var request = gapi.client.plus.people.get({
                    'userId': 'me'
                });
                request.then(function(response) {
                    console.log(response.result);
                    $scope.$apply(function(){
                        $scope.userEmail = response.result.emails[0].value;
                        $scope.displayName = response.result.displayName;
                        $scope.userImage = response.result.image.url;
                    });

                },function(reason) {
                    console.log('Error: ' + reason.result.error.message);
                });
            });
        };

        // Button "go" (navigate to a single entity page)
        $scope.go = function (path) {
            $location.path(path);
        };

        // When callback is received, we need to process authentication.
        $scope.signIn = function() {
            GPlusAuthService.signIn().then(function(response) {
                GPlusAuthService.setSignedIn(true);
                $scope.getUserInfo();
                //$scope.go("/emails");
            });
        };

        $scope.signOut = function() {
            console.log("trying to signout");
            GPlusAuthService.signOut();
            GPlusAuthService.setSignedIn(false);
        }

        $scope.$watch(function() { return $location.path(); }, function(){
            if (!GPlusAuthService.isSignedIn()){
                $location.path('/home');
            }
        });

        // When callback is received, we need to process authentication.
        $scope.createAccount = function() {
            $scope.go("/signup");
        };

        //$scope.signIn();
    }]);

    /*singup controller */
    app.controller("signupController", ['$scope', 'flash', '$location', 'dataFactory', 'GPlusAuthService','$http', function ($scope, flash, $location, dataFactory, GPlusAuthService,$http) {
        console.log("in the signup controller!");
    }]);

    /*emails controller*/
    app.controller('emailsController', ['$scope', 'flash', 'dataFactory', function ($scope, flash, dataFactory) {
        console.log("in the emails controller for whatever reason!");


        $scope.getEmailsBatch = function(userEmail, maxResults){
            gapi.client.request({
                'path': 'https://www.googleapis.com/gmail/v1/users/'+userEmail+'/messages?maxResults='+maxResults,
                'method': 'GET',
                'headers': {
                    'Content-Type': 'application/json'
                },
                'labelIds': 'INBOX',
                'callback': function(jsonResponse, rawResponse) {
                    console.log(jsonResponse);
                    $scope.emailList = jsonResponse;

                    var batchRequest = gapi.client.newBatch();
                    for(i=0;i< $scope.emailList.messages.length;i++){
                        console.log('added - ' + $scope.emailList.messages[i].id);
                        batchRequest.add(
                            gapi.client.request({
                                'path': 'https://www.googleapis.com/gmail/v1/users/'+$scope.userEmail+'/messages/' + $scope.emailList.messages[i].id,
                                'method': 'GET',
                                'headers': {
                                    'Content-Type': 'application/json'
                                }
                            })
                        );
                    };
                    console.log(batchRequest);
                    batchRequest.then(function(jsonBulkMessages){
                        console.log(jsonBulkMessages.result);
                        $.each(jsonBulkMessages.result, function(i, item) {
                            console.log(item.result.id);
                            $scope.$apply(function(){
                                $scope.emailsBatch[i].id = item.result.id;

                            });

                            console.log(item.result.payload.headers);
                            $.each(item.result.payload.headers, function(i, header) {
                                if(header.name=="Subject"){
                                    console.log(header.value);
                                    $scope.$apply(function(){
                                        $scope.emailsBatch[i].subject = header.value;
                                    });
                                }
                            });

                            console.log('end payload');
                        });

                        console.log('batch displayed');

                    },function(reason) {
                        console.log('Error: ' + reason.result.error.message);
                    });
                }
            });
        };

        $scope.getEmailsBatch($scope.userEmail, 10);

    }]);

    /*single email controller (new,edit & delete )*/
    app.controller('singleEmailController', [ '$scope' , 'flash' , 'dataFactory' , '$http' , '$routeParams' , function ( $scope , flash , dataFactory, $http , $routeParams ) {
        $scope.EMAILID = $routeParams.param1;
        console.log('params are - '+$scope.EMAILID);

        $scope.getMessage = function(id){
            gapi.client.request({
                'path': 'https://www.googleapis.com/gmail/v1/users/'+$scope.userEmail+'/messages/' + id,
                'method': 'GET',
                'headers': {
                    'Content-Type': 'application/json'
                },
                'callback': function(jsonResponse, rawResponse) {
                    console.log(jsonResponse);
                    $scope.$apply(function(){
                        $scope.from = jsonResponse.payload.headers[12].value;
                    });
                }
            });
        }
        $scope.getMessage($scope.EMAILID);

    }]);

    /*initialize bootstrap*/
    angular.element(document).ready(function () {
        angular.bootstrap(document, ['app']);
    });
})();