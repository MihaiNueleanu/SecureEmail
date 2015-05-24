(function () {

    /*creating app (currently adding coockies and route)*/
    var app = angular.module('app', ['ngCookies', 'ngRoute', 'ngSanitize',  'directive.g+signin']);

    /* whenever change page or load ensuring user is logged in if not redirecting to home */
    app.run(function($rootScope, $location) {
        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
            if ($rootScope.signedIn) {

            }else{
                $location.path("/home");
            }
        });

        $rootScope.$on('event:google-plus-signin-success', function (event,authResult) {
            console.log("user is signed in");
            $('#signup .step.step-1').addClass('hidden');
            $rootScope.signedIn = true;

        });

        $rootScope.$on('event:google-plus-signin-failure', function (event,authResult) {
            console.log("user is not signed in - redirecting to home");
            $('#signup .step.step-1').removeClass('hidden');
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

    app.factory("ppsService", ['$http', '$location', '$cookieStore', function($http ,$location, $cookieStore) {
        var serviceBase = 'services/'
        var obj = {};

        obj.createAccount = function (uid , ps , ph , pubkey , privkey) {
            console.log("IN THE FACTORY WE HAVE: uid:" + uid + " ,ps: " + ps + " ,ph: " + ph + " ,AND THE KEYS...");
            return $http.post(serviceBase + 'createAccount',{
                'uid': uid,
                'ps': ps,
                'ph': ph,
                'pubkey': pubkey,
                'privkey': privkey
            }).then(function (result) {
                console.log(result);
                return result;
            });
        };

        obj.getKeyPair = function(uid , ps , ph ){
            console.log("$http.get(" + serviceBase + 'getKeyPair?uid=' + uid +'&ps='+ ps + '&ph='+ ph)
            return $http.get(serviceBase + 'getKeyPair?uid=' + uid +'&ps='+ ps + '&ph='+ ph).then(function (result) {
                console.log(result);

                $cookieStore.put("pubkey",result.data.pubkey);
                $cookieStore.put("privkey",result.data.privkey);

                $location.path("/emails");
                return result;
            });
        };

        obj.getPublicKey = function(uid ){
            console.log("$http.get(" + serviceBase + 'getPublicKey?uid=' + uid )
            return $http.get(serviceBase + 'getPublicKey?uid=' + uid).then(function (result) {
                $cookieStore.put("rpubkey",result.data.pubkey);
                //console.log("--------------------FACTORY-----------------------");
                //console.log(result.data.pubkey);
                //console.log("--------------------------------------------------");
                return result;
            });
        };

        return obj;
    }]);

    /*configuring route provider (views)*/
    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
        when('/emails', {
            templateUrl: 'views/emails/index.html',
            controller: 'emailsController'
        }).
        when('/email/:param', {
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
    app.controller("mainController", [ '$scope', 'flash', '$location', '$rootScope', function ($scope, flash, $location, $rootScope ) {
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

                        $rootScope.userEmail = $scope.userEmail
                    });
                    //var hasAccount = $cookieStore.get("hasAccount");
                },function(reason) {
                    console.log('Error: ' + reason.result.error.message);
                });
            });
        };

        $scope.$on('event:google-plus-signin-success', function (event,authResult) {
            $scope.getUserInfo();
        });
    }]);

    /*sign-up(FORM) controller */
    app.controller("signupController", ['$scope', 'flash', '$location', '$rootScope', 'ppsService', function ($scope, flash, $location, $rootScope, ppsService) {
        console.log("in the signup controller!");

        $scope.passphrase;

        $scope.validateForm = function() {
            console.log("validating form");
            var userId = $rootScope.userEmail;
            var salt = "notSoRandomSalt" //TODO should be changed to be maybe base64 of email...
            var temp = CryptoJS.SHA1($scope.passphrase + salt);
            var hash = temp.toString();
            console.log("Hashed Passphrase:");
            console.log(hash);

            console.log("going to try and create a key pair for scope.userId: " + userId + " and scope.hashedPassphrase: " + hash );

            var options = {
                numBits: 2048,
                userId: userId,
                passphrase: hash
            };

            openpgp.generateKeyPair(options).then(function(keypair) {
                // success
                var publicKey = keypair.publicKeyArmored;
                var privateKey = keypair.privateKeyArmored;

                console.log("generated public key:\n\n" + publicKey);
                console.log("generated private key:\n\n" + privateKey);

                console.log("SENDING THIS TO FACTORY userId:" + userId + " ,salt: " + salt + " ,hash: " + hash + " ,AND THE KEYS...");
                ppsService.createAccount(userId , salt , hash , publicKey , privateKey);

            }).catch(function(error) {
                // failure
            });


        };
    }]);

    /*sign-in(FORM) controller */
    app.controller("signinController", ['$scope', 'flash', '$location', '$rootScope', 'ppsService', function ($scope, flash, $location, $rootScope, ppsService) {
        console.log("in the signin controller!");

        $scope.passphrase;

        $scope.validateForm = function() {
            console.log("validating form");
            var userId = $rootScope.userEmail;
            var salt = "notSoRandomSalt" //TODO should be changed to be maybe base64 of email...
            var temp = CryptoJS.SHA1($scope.passphrase + salt);
            var hash = temp.toString();
            console.log("Hashed Passphrase:");
            console.log(hash);

            console.log("going to try and retrieve the key pair for scope.userId: " + userId + " and hash: " + hash + "and this salt:" + salt );

            ppsService.getKeyPair(userId , salt , hash);

        };
    }]);

    /*compose mail form controller*/
    app.controller('composeMailController', ['$scope', 'flash', '$cookieStore','$rootScope', 'ppsService', function ($scope, flash, $cookieStore, $rootScope, ppsService) {
        $scope.pubkey = $cookieStore.get('pubkey');
        $scope.privkey = $cookieStore.get('privkey');

        $scope.mailTo = "mihai.nueleanu@gmail.com" ; //TODO make it work
        $scope.mailContent ; //TODO make it work
        $scope.mailSubject ; //TODO make it work

        $scope.$watch('mailTo', function() {
            ppsService.getPublicKey($scope.mailTo).then(function() {
                $scope.recipentPublicKey = $cookieStore.get("rpubkey");
                console.log("********************************************************************");
                console.log($scope.recipentPublicKey);
                console.log("********************************************************************");
            });
        });


        /*var str = 'http://mail.google.com/mail/?view=cm&fs=1'+
            '&to=' + opts.to +
            '&su=' + opts.subject +
            '&body=' + opts.message.replace(/\n/g,'%0A') +
            '&ui=1';*/

        /*$scope.sendMail = function(mailTo, mailContent, recipentPublicKey, callback) {*/
        $scope.sendMail = function() {
            console.log("Trying to encrypted message")

            $scope.encryptedMailContent;

            var encryptMailContent = function(publicKey, mailContent) {
                /*console.log("encryptMailContent: Trying to encrypt: publicKey : \n" + publicKey + "\n\n mailContent: \n" + mailContent )*/
                var key = openpgp.key.readArmored(publicKey);

                openpgp.encryptMessage(key.keys, mailContent).then(function(encryptedMailContent) {
                    console.log("success! :)");
                    //console.log(encryptedMailContent);
                    $scope.encryptedMailContent = encryptedMailContent;
                    console.log($scope.encryptedMailContent);
                }).catch(function(error) {
                    console.log("fail :(");
                    return error;
                });
            };

            encryptMailContent($scope.recipentPublicKey ,$scope.mailContent);

            /*var message =   "-----BEGIN PGP MESSAGE----- \n" +
                            "Version: OpenPGP.js v0.10.1 \n" +
                            "Comment: http://openpgpjs.org \n" +
                            "wcBMA9BEIWX6J/2oAQf/dcU7FefL+y0QrLeG0a9CvgejyyVSCAkkF86dGi1c \n" +
                            "pxBIy1z1UePPgc0JdXANHtpCHYIXRczZbVlBQDAolubHgqKuPa5I3yw9VgZo \n" +
                            "jE6NlCmgLQSZjysiBQFMzVmya4St+hEt3cjJvvW55KYKV4vymS5YO2fJP0IU \n" +
                            "mtbfnh4iMmT1bqC37EG/glHewbPFxqnogPZeEPcLjCGl3eOgu2WNrcorZwYf \n" +
                            "ymh2n32tYp0k0XaC5YV9Y4s8LJAICxBdKeThgSlPHIrvYsks0JJKyeOYwtZu \n" +
                            "00j6iIZJUXoF5NMk/7wOZmavii5WgltsFAkIeGutXGpK0+4MIxhrELBW3F3/ \n" +
                            "0dJHAUBLIUC1GR7DhQY5PyQMsnukmwxy4Z6ixPVF47/aY0epR/jeM8bZcLs8 \n" +
                            "5pn9R9aT2oZ9hO93RYHkIwAv1IevbO7WW799BZA= \n" +
                            "    =Iy/D \n" +
                            "-----END PGP MESSAGE-----";*/

            //TODO REVIVE ME
            /*
            gapi.client.request({
                'path': 'https://www.googleapis.com/gmail/v1/users/'+$scope.userEmail+'/messages/send',
                'method': 'POST',
                'headers': {'Content-Type': 'application/json'},
                'message': {
                    "payload": {
                        "body": {
                            "data": "hello mihai"
                        }
                    }
                    'raw': base64EncodedEmail
                },
                'callback': function(jsonResponse) {
                    console.log(jsonResponse);
                }
            });
            request.execute(callback);*/

            gapi.client.load('gmail', 'v1', function() {
                console.log("GMAIL LOADED");
                sendMessage = function(email,callback) {
                    console.log("in the mail sending");
                    var base64Encoded = btoa(email);
                    var request = gapi.client.gmail.users.messages.send({
                        userId: 'me',
                        resource: {
                            'raw': base64Encoded
                        }
                    });
                    console.log("executing request");
                    request.execute(callback);

                };
                var to = $scope.mailTo,
                    subject = $scope.mailSubject,
                    content = $scope.encryptedMailContent;

                var email = "From: 'me'\r\n"+
                    "To:  "+ to +"\r\n"+
                    "Subject: "+subject+"\r\n"+
                    "\r\n"+
                    content;
                sendMessage(email, function (arguments) {
                    console.log("after message sending ");
                    console.log(arguments);
                });

            });
        }
    }]);

    /*emails controller*/
    app.controller('emailsController', ['$scope', 'flash', '$cookieStore', function ($scope, flash, $cookieStore) {

        $scope.pubkey = $cookieStore.get('pubkey');
        $scope.privkey = $cookieStore.get('privkey');

        var extractField = function(json, fieldName) {
            return json.result.payload.headers.filter(function(header) {
                if (header.name === fieldName) {
                    console.log("Value of: " + header.name + "  is: " + header.value);
                }
                return header.name === fieldName;
            })[0].value; //TODO check for undefiend
        };

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
                        console.log("ID: " + $scope.emailList.messages[i].id + " messageCOUNTER: " + i);
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

                    //console.log(batchRequest);
                    batchRequest.then(function(jsonBulkMessages){
                        console.log(jsonBulkMessages.result);

                        $.each(jsonBulkMessages.result, function(i, item) {

                            from = extractField(item, "From");
                            to = extractField(item, "To");
                            subject = extractField(item, "Subject");
                            date = extractField(item, "Date");

                            $scope.$apply(function(){
                                //console.log("mailId: " + item.result.id + " subject: " + subject + " date: " + date + " from: " + from +" to: " +to);
                                $scope.emailsObject.push({"mailId":item.result.id,"subject":subject , "date":date, "from":from,"to":to});
                            });

                        });

                        console.log('batch displayed');
                        //console.log($scope.emailsObject);
                        //$scope.emailsObject.shift()

                    },function(reason) {
                        console.log('Error: ' + reason.result.error.message);
                    });
                }
            });
        };

        $scope.getEmailsBatch($scope.userEmail, 10);

    }]);

    /*single email controller (new,edit & delete )*/
    app.controller('singleEmailController', [ '$scope' , 'flash' , '$http' , '$routeParams' , function ( $scope, flash, $http, $routeParams ) {
        $scope.param = $routeParams.param;
        console.log('params are - '+$scope.param);

        var extractField = function(json, fieldName) {
            return json.payload.headers.filter(function(header) {
                return header.name === fieldName;
            })[0].value;
        };

        $scope.getMessage = function(id){
            gapi.client.request({
                'path': 'https://www.googleapis.com/gmail/v1/users/'+$scope.userEmail+'/messages/' + id,
                'method': 'GET',
                'headers': {
                    'Content-Type': 'application/json'
                },
                'callback': function(jsonResponse, rawResponse) {
                    console.log(jsonResponse);

                    var part = jsonResponse.payload.parts.filter(function(part) {
                        console.log(part);
                        return part.mimeType == 'text/html';
                    });

                    $scope.$apply(function(){
                        $scope.from = extractField(jsonResponse, "From");
                        $scope.to = extractField(jsonResponse, "To");
                        $scope.subject = extractField(jsonResponse, "Subject");
                        $scope.messageBody = atob(part[0].body.data.replace(/-/g, '+').replace(/_/g, '/'));
                    });

                }
            });
        }

        /*var key = '-----BEGIN PGP PRIVATE KEY BLOCK ... END PGP PRIVATE KEY BLOCK-----';
        var privateKey = openpgp.key.readArmored(key).keys[0];
        privateKey.decrypt('passphrase');

        var pgpMessage = '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----';
        pgpMessage = openpgp.message.readArmored(pgpMessage);

        openpgp.decryptMessage(privateKey, pgpMessage).then(function(plaintext) {
            // success
        }).catch(function(error) {
            // failure
        });*/
        $scope.getMessage($scope.param);

    }]);

    /*initialize bootstrap*/
    angular.element(document).ready(function () {
        angular.bootstrap(document, ['app']);
    });
})();