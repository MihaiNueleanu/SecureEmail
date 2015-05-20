(function () {
    /*creating app (currently adding coockies and route)*/
    var app = angular.module('app', ['ngCookies', 'ngRoute', 'directive.g+signin']);

    /* whenever change page or load ensuring user is logged in if not redirecting to home */
    app.run(function($rootScope, $location) {
        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
            if ($rootScope.signedIn) {

            }else{
                $location.path("/home");
            }
        });

        $rootScope.$on('event:google-plus-signin-success', function (event,authResult) {
            console.log("RUN(page load) test - user is signed in");
            $rootScope.signedIn = true;
            //$location.path("/emails");
        });

        $rootScope.$on('event:google-plus-signin-failure', function (event,authResult) {
            console.log("RUN(page load) test - user is not signed in - redirecting to home");
            $rootScope.signedIn = false;
            $location.path("/home");
        });
    });

    /* testing for a userEmail cookie and if does not exist redirecting to main */
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
    app.controller("NavController", ['CONFIG', '$scope', '$cookieStore', function (CONFIG, $scope, $cookieStore) {
        this.links = CONFIG.LINKS;

        this.isSet = function (link) {
            return this.link === link;
        };

        this.navClick = function (link) {
            this.link = link;
        };

        $scope.signOut = function () {
            console.log("sign out using NAV");
            gapi.auth.signOut();
        };

    }]);

    /*main controller (general table row selection + displaying messages)*/
    app.controller("mainController", [ '$scope', 'flash', '$location', '$cookieStore', function ($scope, flash, $location, $cookieStore ) {
        $scope.userEmail;
        $scope.displayName;
        $scope.userImage;

        // Button "go" (navigate to a single entity page)
        $scope.go = function (path) {
            $location.path(path);
        };

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

        $scope.$on('event:google-plus-signin-success', function (event,authResult) {
            $scope.getUserInfo();
        });
    }]);

    /*singup(FORM) controller */
    app.controller("signupController", ['$scope', 'flash', '$location', '$cookieStore', function ($scope, flash, $location, $cookieStore) {
        console.log("in the signup controller!");

        $scope.passphrase;
        $scope.hashedPassphrase;

        $scope.$watch('passphrase' ,function() {
            //$scope.hashedPassphrase = md5.createHash($scope.passphrase || '');
            $scope.hashedPassphrase = $scope.passphrase;
        });

        $scope.validateForm = function() {
            console.log("validating form");
            $scope.userId = $cookieStore.get('userEmail');
            console.log("going to try and create a key pair for scope.userId: " + $scope.userId + " and scope.hashedPassphrase: " + $scope.hashedPassphrase );

            var options = {
                numBits: 2048,
                userId: $scope.userId,
                passphrase: $scope.hashedPassphrase
            };

            openpgp.generateKeyPair(options).then(function(keypair) {
                // success
                var privateKey = keypair.privateKeyArmored;
                var publicKey = keypair.publicKeyArmored;

                console.log("generated private key:\n\n" + privateKey);
                console.log("generated public key:\n\n" + publicKey);

            }).catch(function(error) {
                // failure
            });


        };
    }]);

    /*emails controller*/
    app.controller('emailsController', ['$scope', 'flash', function ($scope, flash) {
        $scope.emailsObject = [{}];
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

                            var emailHeaders = {};
                            console.log(item.result.id);

                            console.log(item.result.payload.headers);
                            $.each(item.result.payload.headers, function(i, header) {
                                if(header.name=="Subject"){
                                    console.log(header.value);
                                    $scope.$apply(function(){
                                        $scope.emailsObject.push({"mailId":item.result.id,"subject":header.value,"":""});
                                    });
                                }
                            });

                            console.log('end payload');
                        });

                        console.log('batch displayed');
                        console.log($scope.emailsObject);

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