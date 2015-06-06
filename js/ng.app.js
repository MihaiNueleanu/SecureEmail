//TODO use the items in the ppsService
//TODO fix flash messages

(function () {
    /*creating app (currently adding coockies and route)*/
    var app = angular.module('app', ['ngCookies', 'ngRoute', 'ngSanitize', 'ui.tinymce', 'directive.g+signin']);

    /* whenever change page or load ensuring user is logged in if not redirecting to home */
    app.run(function($rootScope, $location, $cookieStore, $timeout) {
        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
            if ($cookieStore.get("signedIn") == "true") {
                console.log("cookie check value is true");
            }else{
                console.log("cookie check value is not true ill redirect just in case.");
                $location.path("/home");
            }
        });

        /*Event listeners for loader*/
        $rootScope.$on('event:show-loader', function () {
            $('#loading-spinner').stop().fadeIn('100');
        });

        $rootScope.$on('event:hide-loader', function () {
            $('#loading-spinner').stop().fadeOut('100');
        });

        /*Event listener for flash*/
        $rootScope.$on('event:show-flash', function () {
            console.log("GOT AN EVENT I SHOULD SHOW THE FLASH MESSAGE!!!");
            $('#flash').removeClass("hidden").show();
            $timeout(function () {
                $('#flash').stop().hide();
            }, 3000);
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
    app.factory('httpRequestInterceptor', ['$rootScope', function ($rootScope) {
        var interceptor = {
            'request': function (config) {
                $rootScope.$broadcast('event:show-loader');
                return config; //show loader and create request (loader showing has built in delay to avoid showing it when not needed)
            },
            'response': function (response) {
                $rootScope.$broadcast('event:hide-loader');
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
    }]);

    app.factory("ppsService", ['$http', '$location', '$cookieStore','$rootScope','flash', function($http ,$location, $cookieStore, $rootScope, flash) {
        var serviceBase = 'services/'
        var obj = {};

        var items = [];

        obj.addItem = function(item) {
            items.push(item);
        };
        obj.removeItem = function(item) {
            var index = items.indexOf(item);
            items.splice(index, 1);
        };
        obj.items = function() {
            return items;
        };

        obj.createAccount = function (uid , ps , ph , pubkey , privkey) {
            console.log("IN THE FACTORY WE HAVE: uid:" + uid + " ,ps: " + ps + " ,ph: " + ph + " ,AND THE KEYS...");
            return $http.post(serviceBase + 'createAccount',{
                'uid': uid,
                'ps': ps,
                'ph': ph,
                'pubkey': pubkey,
                'privkey': privkey
            }).then(function (result) {
                if (result.status != 404) {
                    $rootScope.$broadcast('event:key-pair-created');
                    console.log(result);
                    return result;
                } else {
                    flash.setMessage({"status":"error", "message":"cannot create user, user already exists, try signing in instead"});
                    console.log("ERROR: Unable to create account, account already exists");
                    $cookieStore.put("accountExists","true");
                    $location.path("/home");
                }
            });
        };

        obj.getKeyPair = function(uid , ps , ph ){
            console.log("$http.get(" + serviceBase + 'getKeyPair?uid=' + uid +'&ps='+ ps + '&ph='+ ph)
            return $http.get(serviceBase + 'getKeyPair?uid=' + uid +'&ps='+ ps + '&ph='+ ph).then(function (result) {
                console.log(result);

                //test if keys were recieved
                if (result.status != 404) {
                    $cookieStore.put("pubkey",result.data.pubkey);
                    $cookieStore.put("privkey",result.data.privkey);
                    $rootScope.$broadcast('event:show-menu');
                    $location.path("/emails");
                    return result;
                } else {
                    flash.setMessage(result.data);
                    console.log("ERROR: Unable to retrieve key pair");
                    $location.path("/home");
                }
            });
        };

        obj.getPublicKey = function(uid ){
            if (uid != undefined) {
                console.log("$http.get(" + serviceBase + 'getPublicKey?uid=' + uid )
                return $http.get(serviceBase + 'getPublicKey?uid=' + uid).then(function (result) {

                    //test if public key revieved
                    if (result.status != 404) {
                        $cookieStore.put("rpubkey",result.data.pubkey);
                        return result;
                    } else {
                        console.log("unable to retrieve public key" + result);
                    }
                });
            }
        };

        return obj;
    }]);

    /* configuring route provider (views) */
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
            templateUrl: 'views/index.html'
        }).
        otherwise({
            redirectTo: '/home'
        });
    }]);

    /* configuring flash messages based on API call responses */
    app.factory("flash", function ($rootScope) {
        var messageContent;
        return {
            setMessage : function (message) {
                console.log("FLASH: Message.status: " + message.status + " ,Message.message: " + message.message);

                if (message.status == "success") {
                    $('#flash').removeClass("alert-danger").addClass("alert-success");
                } else {
                    $('#flash').removeClass("alert-success").addClass("alert-danger");
                }

                if (messageContent != message.message) {
                    messageContent = message.message;
                    $rootScope.$broadcast('event:message-updated');
                }
                return messageContent;
            },
            getMessage:function(){
                return messageContent;
            }
        }
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
        $rootScope.$on('event:hide-menu', function () {
            $scope.hideNav = true;
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

            //$rootScope.signedIn = false;
            $cookieStore.put("signedIn","false");
            $('#signin .step.step-1').removeClass('hidden');
            $('#signin .step.step-1').removeClass('hidden');
            $rootScope.$broadcast('event:hide-menu');
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
        $rootScope.$on('event:message-updated', function() {
            /*$timeout(function () {*/
                $scope.messageContent = flash.getMessage();
                console.log("MAINCONTROLLER: Message content updated!" + $scope.messageContent);
                $rootScope.$broadcast('event:show-flash');
                $rootScope.$broadcast('event:hide-loader');
            /*}, 500);*/
        });

        $rootScope.$on('event:google-plus-signin-success', function () {
            console.log("RUN: user is signed in");
            $('#signup .step.step-1').addClass('hidden');
            $('#signup .step.step-2').removeClass('hidden');
            $('#signin .step.step-1').addClass('hidden');
            $('#signin .step.step-2').removeClass('hidden');
            $cookieStore.put("signedIn","true");
            $scope.getUserInfo();
        });

        $rootScope.$on('event:google-plus-signin-failure', function () {
            console.log("RUN: user signed out (redirecting to home)");
            $('#signup .step.step-1').removeClass('hidden');
            $cookieStore.put("signedIn","false");
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
                passphrase: $scope.passphrase
            };

            openpgp.generateKeyPair(options).then(function(keypair) {
                // success
                var publicKey = keypair.publicKeyArmored;
                var privateKey = keypair.privateKeyArmored;

                console.log("generated public key:\n\n" + publicKey);
                console.log("generated private key:\n\n" + privateKey);

                console.log("SENDING THIS TO FACTORY userId:" + userId + " ,salt: " + salt + " ,hash: " + hash + " ,AND THE KEYS...");
                response = ppsService.createAccount(userId , salt , hash , publicKey , privateKey);
            }).catch(function(error) {
                // failure
            });
        };

        $scope.$watch('passphrase', function() {
            //console.log("changing the passphrase in the rootscope so it could be shared");
            $rootScope.passphrase = $scope.passphrase;
            //console.log("***********************************************");
            //console.log("$rootScope.passphrase" + $rootScope.passphrase);
            //console.log("***********************************************");
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

        $scope.$watch('passphrase', function() {
            //console.log("changing the passphrase in the rootscope so it could be shared");
            $rootScope.passphrase = $scope.passphrase;
            //console.log("***********************************************");
            //console.log("$rootScope.passphrase" + $rootScope.passphrase);
            //console.log("***********************************************");
        });

        $scope.getKeyPair = function() {
            if ($cookieStore.get("signedIn") == "true") {
                console.log("SIGNINCONTROLLER: trying to get a key pair");
                var userId = $rootScope.userEmail;

                console.log("getKeyPair() - $rootScope.userEmail: " + $rootScope.userEmail);
                var salt = btoa(userId);
                var temp = CryptoJS.SHA1($scope.passphrase + salt);
                var hash = temp.toString();

                $cookieStore.put ("ph",hash);
                ppsService.getKeyPair(userId , salt , hash);
            } else {
                flash.setMessage({"status":"error","message":"Please make sure you are currently signed-in to your service provider "})
            }
        };

        /* Event listener */
        $rootScope.$on('event:request-key-pair', function () {
            $scope.getKeyPair();
        });
    }]);

    /*compose mail form controller*/
    app.controller('composeMailController', ['$scope', 'flash', '$location', '$cookieStore','$rootScope', 'ppsService', function ($scope, flash, $location, $cookieStore, $rootScope, ppsService) {
        $scope.pubkey;
        $scope.privkey;

        if($cookieStore.get('pubkey') != "undefined") {
            $scope.pubkey = $cookieStore.get('pubkey');
        }

        if($cookieStore.get('privkey') != "undefined") {
            $scope.privkey = $cookieStore.get('privkey');
        }

        $scope.mailTo = undefined ;
        $scope.mailContent ;
        $scope.mailSubject ;
        $scope.canEncrypt ;

        $scope.$watch('mailTo', function() {
            if ($scope.mailTo != undefined) {
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
            }
        });

        $scope.sendMail = function() {
            //tinyMCE.triggerSave();

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
                    $location.path("/emails");
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
                    console.log("mail Sent success!");
                    flash.setMessage({"status":"success","message":"mail sent successfully"});
                });
            });
        }
    }]);

    /*emails controller*/
    app.controller('emailsController', ['$scope','$rootScope', 'flash', '$cookieStore', function ($scope, $rootScope, flash, $cookieStore) {
        $scope.pubkey;
        $scope.privkey;

        if($cookieStore.get('pubkey') != "undefined") {
            $scope.pubkey = $cookieStore.get('pubkey');
        }

        if($cookieStore.get('privkey') != "undefined") {
            $scope.privkey = $cookieStore.get('privkey');
        }

        var extractField = function(json, fieldName) {
            return json.result.payload.headers.filter(function(header) {
                if (header.name === fieldName) {
                    //console.log("Value of: " + header.name + "  is: " + header.value);
                }
                return header.name === fieldName;
            })[0].value; //TODO check for undefiend
        };
        var isMailSecure = function(json) {
            secMail = false;
            //console.log("is Mail secure?");
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
        $rootScope.$broadcast('event:show-loader');

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
                        $rootScope.$broadcast('event:hide-loader');

                    },function(reason) {
                        console.log('Error: ' + reason.result.error.message);
                    });
                }
            });
        };

        $scope.getEmailsBatch($scope.userEmail, 25); //TODO filter out google hangouts from mails

    }]);

    /*single email controller (new,edit & delete )*/
    app.controller('singleEmailController', [ '$scope' , 'flash' , '$http' , '$rootScope', '$routeParams','$cookieStore', function ( $scope, flash, $http, $rootScope, $routeParams, $cookieStore ) {
        $rootScope.$broadcast('event:show-loader');
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
                        $scope.passphrase = $rootScope.passphrase;

                        if (encrypted) {
                            console.log("I should decrypt a message");
                            encryptedMessage = atob(part.replace(/-/g, '+').replace(/_/g, '/'));

                            var key = $cookieStore.get('privkey');
                            console.log("this is my key: " + key);
                            var privateKey = openpgp.key.readArmored(key).keys[0];
                            console.log("this is my privateKey: " + privateKey);
                            privateKey.decrypt($scope.passphrase);
                            console.log("this is my passphrase: " + $scope.passphrase);

                            pgpMessage = openpgp.message.readArmored(encryptedMessage);

                             openpgp.decryptMessage(privateKey, pgpMessage).then(function(plaintext) {
                                 console.log("Success! :)");
                                 console.log(plaintext);
                                 $scope.$apply(function(){
                                     $scope.messageBody = plaintext;
                                     $rootScope.$broadcast('event:hide-loader');
                                 });
                             }).catch(function(error) {
                                 console.log("Something went wrong");
                                 console.log(error);
                             });
                        } else {
                            $scope.messageBody = atob(part[0].body.data.replace(/-/g, '+').replace(/_/g, '/'));
                            $rootScope.$broadcast('event:hide-loader');
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