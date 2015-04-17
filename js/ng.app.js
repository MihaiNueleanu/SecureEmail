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
        otherwise({
            redirectTo: '/home'
        });
    }]);

    /*configuring data service for bindings*/
    app.factory('dataFactory', ['CONFIG', '$cookies', '$http', function (CONFIG, $cookies, $http) {
        var dataFactory = {};

        /*--- getters and setters for data User GUID ---*/
        dataFactory.getXXX = function () {
            return dataXXX;
        };
        dataFactory.setXXX = function (x) {
            dataXXX = x;
        };

        /*--- building URL string ---*/
        dataFactory.buildUrl = function (url) {
            url = url.toString().toLowerCase(); 
            tempUrl = CONFIG.URLS.BASE;
            switch(url) {
                case "sso":
                    tempUrl = tempUrl + CONFIG.URLS.SSO;
                    break;
                case "field":
                    tempUrl = tempUrl + CONFIG.URLS.FIELD;
                    break;
                case "entity":
                    tempUrl = tempUrl + CONFIG.URLS.ENTITY;
                    break;
                case "universe":
                    tempUrl = tempUrl + CONFIG.URLS.UNIVERSE;
                    break;
                case "user":
                    tempUrl = tempUrl + CONFIG.URLS.USER;
                    break;
                default:
                    throw "UNKNOWN URL: " + url;
                    tempUrl;
            }
            return tempUrl;
        };

        /*--- building params string ---*/
        dataFactory.buildParams = function (params) {
            var tempParams = "?" + decodeURIComponent($.param(params));
            console.log("tempParams: " + tempParams);
            return tempParams;
        };

        /*--- building a query from everything---*/
        dataFactory.buildQuery = function () {
            var dfQuery = "";
            console.log("DATAFACTORY- trying to build query: (" + dfQuery + ") ,url: (" + dataFactory.getDataUrl() + ") ,selectedFactoryId: (" + dataFactory.getSelectedId() + ") ,params: (" + dataFactory.getDataParams() + ")");

            //if dataFactory.getDataUrl() then add it to tempQuery
            if (dataFactory.getDataUrl() != undefined) {
                console.log("DATAFACTORY.getDataUrl() " + dataFactory.getDataUrl());
                url = dataFactory.buildUrl(dataFactory.getDataUrl());
                dfQuery = dfQuery + url;
            }

            //if dataFactory.getDataParams() then add it to tempQuery
            if (Object.keys(dataFactory.getDataParams()).length) {
                console.log("DATAFACTORY params: " + dataFactory.getDataParams());
                params = dataFactory.buildParams(dataFactory.getDataParams());
                dfQuery = dfQuery + params;
            }

            console.log("DATAFACTORY- full query: " + dfQuery);
            return dfQuery;
        }

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

        // Button "go" (navigate to a single entity page)
        $scope.go = function (path, params) {
            if (params != undefined && params == "clearSelected") {
                console.log("should clear selectedId: " + dataFactory.getSelectedId())
                dataFactory.setSelectedId(null);
                $scope.selectedIndex = null;
                $scope.selectedId = null;
                console.log("selectedId should now be null: " + dataFactory.getSelectedId())
            }
            console.log("MAINCONTROLLER.go(): " + path + "/" + dataFactory.getSelectedId());
            $location.path(path);
        };
    }]);

    /*fields controller*/
    app.controller('emailsController', ['$scope', 'dataFactory', function ($scope, dataFactory) {
        dataFactory.setDataUrl("field");

        $scope.data;
        $scope.search = "";

        getData();

        //get data to page.
        function getData() {
            dataFactory.getData().success(function (data) { $scope.data = data; console.log($scope.data); })
        }

        //search function
        $scope.$watch('search', function (tmpStr) {
            minSearchLength = 2;
            if (!tmpStr || tmpStr.length < minSearchLength) {
                dataFactory.deleteDataParams("search");
            } else if (tmpStr === $scope.search && tmpStr.length >= minSearchLength) {
                dataFactory.setDataParams("search", tmpStr);
                getData();
            }
        });
    }]);

    /*single field controller (new,edit & delete )*/
    app.controller('singleEmailController', ['$scope', 'flash', 'dataFactory', function ($scope, flash, dataFactory) {
        dataFactory.setDataUrl("field");
        $scope.flash = flash;
        $scope.currentDate = Date($.now());
        $scope.data;

        //initialize the view
        this.init = function () {
            if (dataFactory.getSelectedId()) {
                console.log("i am editing a field: " + dataFactory.getSelectedId);
                dataFactory.getData().success(function (data) { $scope.data = data; console.log($scope.data); })
            } else {
                console.log("this must be a new field! lets place some crap data in it.");
                $scope.data = {
                    "Field":
                        {
                            "Created": $scope.currentDate,

                            "Id":"",
                            "Datatype": "",
                            "Created":""
                        },
                    "ApiVersion": 1,
                    "ErrorMessage": null,
                    "RequestId": null
                };
                console.log($scope.data);
            }
        }

        this.init();

        //save (navigate to a single entity page)
        $scope.save = function (url, data) {
            if (data.Field.Created == "") {
                data.Field.Created = $scope.currentDate;
            }
            console.log("Save function called!");
            console.log(data," ,url: "+ url);
            dataFactory.postData(url, data).success(function (data) { flash.setMessage("changes saved successfully"); })
        };
    }]);

    /*initialize bootstrap*/
    angular.element(document).ready(function () {
        angular.bootstrap(document, ['app']);
    });
})();