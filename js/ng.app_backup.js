(function () {
    /*creating app (currently adding coockies and route)*/
    var app = angular.module('app', ['ngCookies', 'ngRoute']);

    /*"URLBASE": "http://localhost.fc.local/Fmf2Services/api",*/
    app.constant("CONFIG", {
        "TEXT": {
            "ERROR": "Something went wrong...",
            "SUCCESS": "Hurray it worked!",
        },
        "URLS": {
            "BASE": "//fmf2ws.app.dev.fc.local/api",
            "SSO": "/sso/validate",
            "FIELD": "/field/",
            "ENTITY": "/Entity/",
            "UNIVERSE": "/FundUniverse/",
            "USER": "/User/"
        },
        "LINKS": [
	        {
	            "title": "home",
	            "name": "home",
	            "url": "#home",
	            "disabled": false
	        },
	        {
	            "title": "maintain fields",
	            "name": "fields",
	            "url": "#fields",
	            "disabled": false
	        },
	        {
	            "title": "maintain entities",
	            "name": "entities",
	            "url": "#entities",
	            "disabled": false
	        },
	        {
	            "title": "maintain universes",
	            "name": "universes",
	            "url": "#universes",
	            "disabled": false
	        },
	        {
	            "title": "maintain templates",
	            "name": "templates",
	            "url": "#templates",
	            "disabled": true
	        },
	        {
	            "title": "maintain users",
	            "name": "users",
	            "url": "#users",
	            "disabled": true
	        },
	        {
	            "title": "maintain groups",
	            "name": "groups",
	            "url": "#groups",
	            "disabled": true
	        },
	        {
	            "title": "maintain domains",
	            "name": "domains",
	            "url": "#domains",
	            "disabled": true
	        },
	        {
	            "title": "sso crap for testing",
	            "name": "sso",
	            "url": "#sso",
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

    /*configuring route provider (views)*/
    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
        when('/fields', {
            templateUrl: 'views/fields/index.html',
            controller: 'fieldsController'
        }).
        when('/fields/new', {
            templateUrl: 'views/fields/new.html',
            controller: 'singleFieldController'
        }).
        when('/fields/edit', {
            templateUrl: 'views/fields/edit.html',
            controller: 'singleFieldController'
        }).
        when('/entities', {
            templateUrl: 'views/entities/index.html',
            controller: 'entityController'
        }).
        when('/entities/new', {
            templateUrl: 'views/entities/new.html',
            controller: 'entityController'
        }).
        when('/entities/edit', {
            templateUrl: 'views/entities/edit.html',
            controller: 'entityController'
        }).
        when('/entities/getcontent', {
            templateUrl: 'views/entities/getcontent.html',
            controller: 'entityController'
        }).
        when('/universes', {
            templateUrl: 'views/universes/index.html',
            controller: 'universesController'
        }).
        when('/universes/new', {
            templateUrl: 'views/universes/new.html',
            controller: 'universesController'
        }).
        when('/universes/edit', {
            templateUrl: 'views/universes/edit.html',
            controller: 'universesController'
        }).
        when('/templates', {
            templateUrl: 'views/templates/index.html',
            controller: 'templatesController'
        }).
        when('/users', {
            templateUrl: 'views/users/index.html',
            controller: 'usersController'
        }).
        when('/groups', {
            templateUrl: 'views/groups/index.html',
            controller: 'groupsController'
        }).
        when('/domains', {
            templateUrl: 'views/domains/index.html',
            controller: 'domainsController'
        }).
        when('/sso', {
            templateUrl: 'views/sso/index.html',
            controller: 'ssoController'
        }).
        when('/home', {
            templateUrl: 'views/index.html'
        }).
        otherwise({
            redirectTo: '/home'
        });
    }]);

    /*configuring data service for bindings*/
    app.factory('dataFactory', ['CONFIG', '$cookies', '$http', function (CONFIG, $cookies, $http) {
        var dataFactory = {};
        var dataUrl = "";
        var dataParams = {};
        var dataSelectedId = null;
        var dataUserGuid = "";
        var dataUserName = "";

        var fcssoCookie = $cookies['fcssotoken'];

        /*--- getters and setters for data User GUID ---*/
        dataFactory.getDataUserGuid = function () {
            return dataUserGuid;
        };
        dataFactory.setDataUserGuid = function (user) {
            dataUserGuid = user;
        };

        /*--- getters and setters for data Username ---*/
        dataFactory.getDataUserName = function () {
            return dataUserName;
        };
        dataFactory.setDataUserName = function (name) {
            dataUserName = name;
        };

        /*--- getters and setters for the selected dataUrl---*/
        dataFactory.getDataUrl = function () {
            return dataUrl;
        };
        dataFactory.setDataUrl = function (url) {
            dataUrl = url;
        };

        /*--- getters and setters for the selected dataParams---*/
        dataFactory.getDataParams = function () {
            return dataParams;
        };
        dataFactory.setDataParams = function (name, value) {
            dataParams[name] = value
            //dataParams = params;
        };
        dataFactory.deleteDataParams = function (name) {
            delete dataParams[name];
        };

        /*--- getters and setters for the selected dataSelectedId---*/
        dataFactory.getSelectedId = function () {
            return dataSelectedId;
        };
        dataFactory.setSelectedId = function (id) {
            dataSelectedId = id;
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

            //if dataFactory.getSelectedId() then add it to tempQuery
            if (dataFactory.getSelectedId() != null && dataFactory.getSelectedId() != "") {
                console.log("DATAFACTORY.getSelectedId() " + dataFactory.getSelectedId());
                dfQuery = dfQuery + dataFactory.getSelectedId();
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
        $scope.username = null;
        this.links = CONFIG.LINKS;

        this.init = function () {
            dataFactory.postData("sso").success(function (response) {
                dataFactory.setDataUserGuid(response.UserGuid);
                dataFactory.setDataUserName(response.Username);
                if ($scope.username == null) {
                    $scope.username = dataFactory.getDataUserName();
                    console.log($scope.username);
                }
            })
        };

        this.init();

        this.isSet = function (link) {
            return this.link === link;
        };

        this.navClick = function (link) {
            this.link = link;
            this.init();
            dataFactory.setSelectedId("");
        };
    }]);

    /*main controller (general table row selection + displaying messages)*/
    app.controller("mainController", ['$scope', 'flash', '$location', 'dataFactory', function ($scope, flash, $location, dataFactory) {
        $scope.selectedIndex = null;
        $scope.selectedId = null;
        $scope.search = null;

        //toggle row selection
        $scope.setSelected = function (selectedIndex, selectedId) {
            if (!$scope.isSet(selectedIndex)) {
                $scope.selectedIndex = selectedIndex;
                dataFactory.setSelectedId(selectedId);
                console.log("MAINCONTROLLER.setSelected(): " + dataFactory.getSelectedId());
            } else {
                $scope.selectedIndex = null;
                $scope.selectedId = null;
                //$scope.message = ("Unselected the previously selected row");
                //flash.setMessage($scope.message);
            }
        };

        //test row selection
        $scope.isSet = function (checkIndex) {
            return $scope.selectedIndex === checkIndex;
        };

        //test row selection
        $scope.getSelectedId = function () {
            return $scope.selectedIndex;
        };

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
    app.controller('fieldsController', ['$scope', 'dataFactory', function ($scope, dataFactory) {
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
    app.controller('singleFieldController', ['$scope', 'flash', 'dataFactory', function ($scope, flash, dataFactory) {
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

    /*funds controller*/
    app.controller('entityController', ['$scope', 'dataFactory', function ($scope, dataFactory) {
        dataFactory.setDataUrl("entity");

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

        //confirming selection when entities list is framed
        /*$scope.confirmSelection = function () {
            $scope.universe.RootEntityId = $scope.getSelectedId();
            console.log("confirming selection: " + $scope.getSelectedId());
        };*/
    }]);

    /*single entity controller (new,edit & delete )*/
    app.controller('singleEntityController', ['$scope', 'dataFactory', function ($scope, dataFactory) {

    }]);

    /*universes controller*/
    app.controller('universesController', ['$scope', 'dataFactory', function ($scope, dataFactory) {
        dataFactory.setDataUrl("universe");
        dataFactory.setDataParams("limit", 100);

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

    /*single universe controller (new,edit & delete )*/
    app.controller('singleUniverseController', ['$scope', 'dataFactory', function ($scope, dataFactory) {
        /*dataUrl = "universe";
        dataParams = {};
        dataParams["limit"] = 100;
        $scope.data;*/

        /*universe variables*/
        /*$scope.universe = {};
        $scope.universe.Id = "cc29e3ce-1671-4c69-8b5a-29056432a364";
        $scope.universe.Name = "Testing name from model";
        $scope.universe.Version = 0;
        $scope.universe.LastSaved;
        $scope.universe.LastResolved
        $scope.universe.EntityCountDirect;
        $scope.universe.EntityCountIndirect;
        $scope.universe.NeedsResolve = true;
        $scope.universe.RootEntityId = "";
        $scope.universe.Rules = [];
        
        $scope.getSelectedRootId = function () {
            if ($scope.universe.RootEntityId != "") {
                return $scope.universe.RootEntityId;
            } else {
                return "Please selected Root Entity";
            }
        }

        //post data to API
        function postData(params) {
            dataFactory.postData(dataUrl, dataParams)
                .success(function (data) {
                    console.log('posted successfully : ' + data);
                })
                .error(function (error) {
                    console.log('Unable to post : ' + error);
                });
        }*/
    }]);

    /*initialize bootstrap*/
    angular.element(document).ready(function () {
        angular.bootstrap(document, ['app']);
    });
})();