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

    app.factory("ppsService", ['$http', '$location', '$cookieStore','$rootScope', function($http ,$location, $cookieStore, $rootScope) {
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

                //test if keys were recieved
                if (result.status != 204) {
                    $cookieStore.put("pubkey",result.data.pubkey);
                    $cookieStore.put("privkey",result.data.privkey);
                    $rootScope.$broadcast('event:show-menu');
                    $location.path("/emails");
                    return result;
                } else {
                    console.log("unable to retrieve key pair")
                    $location.path("/home");
                }
            });
        };

        obj.getPublicKey = function(uid ){
            console.log("$http.get(" + serviceBase + 'getPublicKey?uid=' + uid )
            return $http.get(serviceBase + 'getPublicKey?uid=' + uid).then(function (result) {

                //test if public key revieved
                if (result.status != 204) {
                    $cookieStore.put("rpubkey",result.data.pubkey);
                    return result;
                } else {
                    console.log("unable to public key")
                }
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
    app.controller("NavController", ['CONFIG', '$scope','$rootScope', function (CONFIG, $scope, $rootScope) {
        $scope.hideNav = true;
        this.links = CONFIG.LINKS;

        this.isSet = function (link) {
            return this.link === link;
        };

        this.navClick = function (link) {
            this.link = link;
        };

        $rootScope.$on('event:show-menu', function () {
            $scope.hideNav = false;
        });

    }]);

    /*main controller (general table row selection + displaying messages)*/
    app.controller("mainController", [ '$scope', 'flash', '$location', '$rootScope', '$cookieStore','$timeout', function ($scope, flash, $location, $rootScope, $cookieStore, $timeout ) {
        $scope.userEmail;
        $scope.displayName;
        $scope.userImage;

        $scope.signupProgress = 0;
        $scope.keyPairGenerated = false;
        $scope.accountExists = $cookieStore.get("accountExists");

        if ($scope.accountExists == 'true') {
            console.log("MAINCONTROLLER: user already have an account");
            $scope.keyPairGenerated = true;

            //TODO this should only trigger if a stored passphrase is available
            //$rootScope.$broadcast('event:request-key-pair');
        }

        // Button "go" (navigate to a single entity page)
        $scope.go = function (path) {
            $location.path(path);
        };

        $scope.signOut = function () {
            console.log("signing out + removing cookies + resetting scope variables");
            gapi.auth.signOut();

            angular.forEach($cookieStore, function (cookie, key) {
                if (key.indexOf('NAV-') > -1) {
                    $window.sessionStorage.setItem(key, cookie);
                    delete $cookieStore[key];
                }
            });
            $cookieStore.remove("ph");
            $cookieStore.remove("pubkey");
            $cookieStore.remove("privkey");
            $cookieStore.remove("rpubkey");

            $scope.userEmail = null;
            $scope.displayName = null;
            $scope.userImage = null;

            $rootScope.signedIn = false;
            $('#signin .step.step-1').removeClass('hidden');
            $('#signin .step.step-1').removeClass('hidden');
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
                        $scope.signupProgress = 50;

                        // Not sure if needed
                        $rootScope.userEmail = $scope.userEmail;
                        console.log("getUserInfo() - $rootScope.userEmail: " + $rootScope.userEmail);
                    });

                },function(reason) {
                    console.log('Error: ' + reason.result.error.message);
                });
            });
        };

        $scope.accountCreated = function () {
            $scope.accountExists = true;
            $cookieStore.put("accountExists", "true");
            $rootScope.$broadcast('event:request-key-pair');
        };

        /* Event listeners */
        $rootScope.$on('event:google-plus-signin-success', function (event,authResult) {
            console.log("RUN: user is signed in");
            $('#signup .step.step-1').addClass('hidden');
            $('#signup .step.step-2').removeClass('hidden');
            $('#signin .step.step-1').addClass('hidden');
            $('#signin .step.step-2').removeClass('hidden');
            $rootScope.signedIn = true;
            $scope.getUserInfo();
        });

        $rootScope.$on('event:google-plus-signin-failure', function (event,authResult) {
            console.log("RUN: user signed out (redirecting to home)");
            $('#signup .step.step-1').removeClass('hidden');
            $rootScope.signedIn = false;
            $location.path("/home");
        });

        $rootScope.$on('event:key-pair-created', function () {
            console.log("KEY PAIR CREATED SUCESSFULLY IN A DIFFERENT CONTROLLER");
            $scope.signupProgress = 100;
            $scope.keyPairGenerated = true;
            $('#signup .step.step-3').removeClass('hidden');
            $timeout($scope.accountCreated, 3000);
        });
    }]);

    /*sign-up(FORM) controller */
    app.controller("signupController", ['$scope', 'flash', '$location', '$rootScope', 'ppsService', function ($scope, flash, $location, $rootScope, ppsService) {
        console.log("in the signup(createAccount) controller!");

        $scope.passphrase;

        $scope.createAccount = function() {
            console.log("validating form");
            var userId = $rootScope.userEmail;
            var salt = btoa(userId);
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
                $rootScope.$broadcast('event:key-pair-created');

            }).catch(function(error) {
                // failure
            });
        };

        $scope.$watch('passphrase', function() {
            console.log("changing the passphrase in the rootscope so it could be shared");
            $rootScope.passphrase = $scope.passphrase;
        });
    }]);

    /*sign-in(FORM) controller */
    app.controller("signinController", ['$scope', 'flash', '$location', '$rootScope', 'ppsService','$cookieStore', function ($scope, flash, $location, $rootScope, ppsService, $cookieStore) {
        console.log("in the signin(getKeyPair) controller!");

        $scope.passphrase;

        if ($rootScope.passphrase != undefined) {
            console.log("signinController: -$rootScope.passphrase: " + $rootScope.passphrase);
            $scope.passphrase = $rootScope.passphrase;
        }

        $scope.getKeyPair = function() {
            console.log("SIGNINCONTROLLER: trying to get a key pair");
            var userId = $rootScope.userEmail;

            console.log("getKeyPair() - $rootScope.userEmail: " + $rootScope.userEmail);
            var salt = btoa(userId);
            var temp = CryptoJS.SHA1($scope.passphrase + salt);
            var hash = temp.toString();

            $cookieStore.put ("ph",hash);
            ppsService.getKeyPair(userId , salt , hash);
        };

        /* Event listener */
        $rootScope.$on('event:request-key-pair', function () {
            $scope.getKeyPair();
        });
    }]);

    /*compose mail form controller*/
    app.controller('composeMailController', ['$scope', 'flash', '$cookieStore','$rootScope', 'ppsService', function ($scope, flash, $cookieStore, $rootScope, ppsService) {
        $scope.pubkey = $cookieStore.get('pubkey');
        $scope.privkey = $cookieStore.get('privkey');

        $scope.mailTo ;
        $scope.mailContent ;
        $scope.mailSubject ;
        $scope.canEncrypt ;

        $scope.$watch('mailTo', function() {
            ppsService.getPublicKey($scope.mailTo).then(function() {
                if($cookieStore.get("rpubkey") != undefined) {
                    console.log("A key exists for user")
                    $scope.recipentPublicKey = $cookieStore.get("rpubkey");
                    $scope.canEncrypt =  true;
                    console.log($scope.recipentPublicKey);
                } else {
                    //TODO send invite message is not encrypted
                    $scope.canEncrypt =  false;
                }
            });
        });

        $scope.sendMail = function() {
            if ($scope.canEncrypt) {
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
            } else {
                $scope.mailContent = $scope.mailContent + "\r\n all Rights reserved: Best students EVER!";
                $scope.encryptedMailContent = $scope.mailContent;
            }

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
                    console.log(arguments);
                });

            });
        }
    }]);

    /*emails controller*/
    app.controller('emailsController', ['$scope', 'flash', '$cookieStore', function ($scope, flash, $cookieStore) {

        $scope.pubkey;
        $scope.privkey;

        if($cookieStore.get('pubkey') != undefined) {
            $scope.pubkey = $cookieStore.get('pubkey');
        }

        if($cookieStore.get('privkey') != undefined) {
            $scope.privkey = $cookieStore.get('privkey');
        }


        var extractField = function(json, fieldName) {
            return json.result.payload.headers.filter(function(header) {
                if (header.name === fieldName) {
                    console.log("Value of: " + header.name + "  is: " + header.value);
                }
                return header.name === fieldName;
            })[0].value; //TODO check for undefiend
        };
        var isMailSecure = function(json) {
            secMail = false;
            console.log("is Mail secure?");
            if (json.result.snippet.indexOf("-----BEGIN PGP MESSAGE-----") > -1 && json.result.snippet != undefined ) {
                secMail = true;
            }else {
                secMail = false;
            }
            console.log("isMailSecure " + secMail);
            return secMail;
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
                        //console.log(jsonBulkMessages.result);

                        $.each(jsonBulkMessages.result, function(i, item) {

                            from = extractField(item, "From");
                            to = extractField(item, "To");
                            subject = extractField(item, "Subject");
                            date = extractField(item, "Date");

                            if (item.result.snippet !=undefined ) {
                                //console.log("snippet is there");
                                isSecure = false;
                                isSecure = isMailSecure(item);
                            } else {
                                //console.log("snippet is not there");
                            }


                            $scope.$apply(function(){
                                //console.log("mailId: " + item.result.id + " subject: " + subject + " date: " + date + " from: " + from +" to: " +to);
                                $scope.emailsObject.push({"mailId":item.result.id,"subject":subject , "date":date, "from":from,"to":to,"secure":isSecure});
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

        $scope.getEmailsBatch($scope.userEmail, 25); //TODO filter out google hangouts from mails

    }]);

    /*single email controller (new,edit & delete )*/
    app.controller('singleEmailController', [ '$scope' , 'flash' , '$http' , '$routeParams','$cookieStore', function ( $scope, flash, $http, $routeParams, $cookieStore ) {
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

                    if (jsonResponse.payload.parts != undefined){
                        console.log("i have parts");
                        var part = jsonResponse.payload.parts.filter(function(part) {
                            console.log(part);
                            encrypted = false;
                            return part.mimeType == 'text/html';
                        });
                    }else if (jsonResponse.payload.body.data != undefined){
                        console.log("i DONT have parts i must be encrypted");
                        var part = jsonResponse.payload.body.data;
                        console.log(part);
                        encrypted = true;
                    }

                    $scope.$apply(function(){
                        $scope.from = extractField(jsonResponse, "From");
                        $scope.to = extractField(jsonResponse, "To");
                        $scope.subject = extractField(jsonResponse, "Subject");
                        ph = $cookieStore.get("ph");

                        if (encrypted) {
                            console.log("I should decrypt this:");
                            encryptedMessage = atob(part.replace(/-/g, '+').replace(/_/g, '/'));

                            var key = $cookieStore.get('privkey');

                            var privateKey = openpgp.key.readArmored(key).keys[0];

                            privateKey.decrypt(ph); //TODO make this work with the normal passphrase
                            pgpMessage = openpgp.message.readArmored(encryptedMessage);

                             openpgp.decryptMessage(privateKey, pgpMessage).then(function(plaintext) {
                                 console.log("Success! :)");
                                 console.log(plaintext);
                                 $scope.$apply(function(){

                                     $scope.messageBody = plaintext;
                                 });
                             }).catch(function(error) {
                                 console.log("Something went wrong");
                                 console.log(error);
                             });
                        } else {
                            $scope.messageBody = atob(part[0].body.data.replace(/-/g, '+').replace(/_/g, '/'));
                        }
                    });
                }
            });
        }
        $scope.getMessage($scope.param);
    }]);

    /*initialize bootstrap*/
    angular.element(document).ready(function () {
        angular.bootstrap(document, ['app']);
    });
})();