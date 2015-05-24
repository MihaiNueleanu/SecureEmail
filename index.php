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
	<nav class="navbar navbar-default navbar-fixed-top" ng-controller="NavController as nav">
		<div class="navbar-header">
			<button aria-controls="navbar" aria-expanded="false" data-target="#navbar" data-toggle="collapse" class="navbar-toggle collapsed" type="button">
			<span class="sr-only">Toggle navigation</span>
			<span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
			</button>
			<a href="#" class="navbar-brand"><img src="images/icon.png"/>Mizaru<span class="light"></span></a>
		</div>
		<div class="collapse navbar-collapse" id="navbar">
			<ul class="nav navbar-nav">
                <li ng-repeat="link in nav.links" ng-class="{disabled: link.disabled, active: nav.isSet($index)}" ng-hide="hideNav">
                    <a title="{{link.title}}" href="{{link.url}}" ng-click="link.isDisabled || nav.navClick($index)" ng-show="userImage" >{{link.name}}</a>
                </li>
                <li ng-show="userImage" class="logout">
                    <a ng-click="signOut()">Sign out</a>
                </li>
                <li class="disabled" ng-class="{disabled: link.disabled, active: nav.isSet($index)}" ng-hide="hideNav">
                    <a href="#/home">Sign-in</a>
                </li>
                <li ng-hide="hideNav" class="compose">
                    <a class="bg-primary" data-toggle="modal" data-target="#myModal"><span class="glyphicon glyphicon-pencil"></span> Compose mail</a>
                </li>
			</ul>
            <span class="logged-user" title="log out">{{displayName}}<img class="g-user" src="{{userImage}}" /></span>
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

    <!-- Modal -->
    <div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" ng-controller="composeMailController">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title" id="myModalLabel">Compose Mail</h4>
                </div>
                <div class="modal-body" >

                    <form id="compose-mail-form" name="compose-mail-form" novalidate >
                        <div class="form-group ">
                            <label for="To">Email address</label>
                            <input type="text" class="form-control" id="To" ng-model="mailTo" placeholder="someone@somewhere.com" ng-model-options="{ updateOn: 'default blur', debounce: {'default': 1000, 'blur': 0} }" required>
                            <span class="label label-success" ng-show="canEncrypt">Encrypted mail is possible</span>
                            <span class="label label-warning" ng-show="canEncrypt==false">Message will not be encrypted</span>
                        </div>

                        <div class="form-group ">
                            <label for="Subject">Subject</label>
                            <input type="text" class="form-control" id="Subject" ng-model="mailSubject" placeholder="Subject" required>
                        </div>
                        <div class="form-group">
                            <label for="mailContent">Message</label>
                            <textarea class="form-control" rows="5" id="mailContent" ng-model="mailContent" ng-minlength="1" placeholder="Write your secret message here" required></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-disabled="form.$invalid" ng-click="sendMail()" data-dismiss="modal">Send</button>
                </div>
            </div>
        </div>
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

    <!-- loading pgp + crypto hash(SHA-1) -->
    <script type="text/javascript" src="js/openpgp.js"></script>
    <script src="http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha1.js"></script>

    <!-- general functions -->
    <script type="text/javascript" src="js/functions.js"></script>

    <!-- Google Sign In -->
    <script type="text/javascript" src="js/google-plus-signin.js"></script>

    <!-- angularJS scripts -->
    <script type="text/javascript" src="js/ng.app.js"></script>

</body>
</html>

