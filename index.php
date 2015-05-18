<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>testing SSO + Angular JS</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" /> 
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href='http://fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,700,700italic' rel='stylesheet' type='text/css'>    

    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap-theme.min.css">
    <link rel="stylesheet" type="text/css" href="css/font-awesome.css">
    <link rel="stylesheet" type="text/css" href="css/bootstrap-social.css">

    <link rel="stylesheet" type="text/css" href="css/default.css">
</head>
<body ng-controller="mainController">
	<nav class="navbar navbar-default navbar-fixed-top" ng-controller="NavController as nav" ng-cloak>
		<div class="navbar-header">
			<button aria-controls="navbar" aria-expanded="false" data-target="#navbar" data-toggle="collapse" class="navbar-toggle collapsed" type="button">
			<span class="sr-only">Toggle navigation</span>
			<span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
			</button>
			<a href="#" class="navbar-brand"><img src="images/icon.png"/>Mizaru<span class="light"></span></a>
		</div>
		<div class="collapse navbar-collapse" id="navbar">
			<ul class="nav navbar-nav" ng-repeat="link in nav.links">
                <li ng-class="{disabled: link.disabled, active: nav.isSet($index), hidden: !isSignedIn() }">
                    <a title="{{link.title}}" href="{{link.url}}" ng-click="link.isDisabled || nav.navClick($index)" >{{link.name}}</a>
                </li> 
			</ul>
			<a ng-click="signOut()" ng-show="isSignedIn()">
                <span class="logged-user" ng-show="displayName" title="log out">{{displayName}}<img src="{{userImage}}" /></span>
            </a>
        </div>
    </nav>

    <div class="alert alert-success" ng-show="flash.getMessage()" ng-cloak>
        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
        <span class="sr-only">Error:</span>
        {{flash.getMessage()}}
    </div>

    <script>
    (function() {
        var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
        po.src = 'https://apis.google.com/js/client:plusone.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
    })();
    </script>
    <script src="https://apis.google.com/js/client.js?onload=handleClientLoad"></script>

    <!--- Loader Use later
    <div id="loading-spinner" class="alert">
        <p>Loading, please wait.</p>
        <img src="images/loader.gif" />
    </div> --->

    <div ng-view ng-cloak></div>

    <!-- loading scripts -->
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular.js"></script>
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular-cookies.js"></script>
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular-route.js"></script>

    <script type="text/javascript" src="//code.jquery.com/jquery-1.11.2.min.js"></script>
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>

    <!-- general functions -->
    <script type="text/javascript" src="js/functions.js"></script>
    <!-- angularJS scripts -->
    <script type="text/javascript" src="js/ng.app.js"></script>


</body>
</html>

