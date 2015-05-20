<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Mizaru - Keep it to yourself</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" /> 
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href='http://fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,700,700italic' rel='stylesheet' type='text/css'>    

    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">

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
			<ul class="nav navbar-nav" ng-repeat="link in nav.links" ng-class="{hidden:nav.isHidden()}">
                <li ng-class="{disabled: link.disabled, active: nav.isSet($index)}">
                    <a title="{{link.title}}" href="{{link.url}}" ng-click="link.isDisabled || nav.navClick($index)" >{{link.name}}</a>
                </li> 
			</ul>
			<a ng-click="signOut()" ng-show="userImage">
                <span class="logged-user" title="log out">{{displayName}}<img class="g-user" src="{{userImage}}" /></span>
            </a>
        </div>
    </nav>

    <div class="alert alert-success" ng-show="flash.getMessage()" ng-cloak>
        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
        <span class="sr-only">Error:</span>
        {{flash.getMessage()}}
    </div>

    <div id="loading-spinner" class="alert">
        <h3>Loading, please wait.</h3>
        <i class="fa-5x fa fa-refresh fa-spin spinner-color"></i>
    </div>

    <div ng-view ng-cloak></div>

    <!-- loading angular scripts -->
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular.js"></script>
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular-cookies.js"></script>
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular-route.js"></script>
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular-sanitize.js"></script>

    <!-- loading bootstrap + jquery -->
    <script type="text/javascript" src="//code.jquery.com/jquery-1.11.2.min.js"></script>
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>

    <!-- loading pgp -->
    <script type="text/javascript" src="js/openpgp.js"></script>

    <!-- general functions -->
    <script type="text/javascript" src="js/functions.js"></script>

    <!-- Google Sign In -->
    <script type="text/javascript" src="js/google-plus-signin.js"></script>

    <!-- angularJS scripts -->
    <script type="text/javascript" src="js/ng.app.js"></script>

</body>
</html>

