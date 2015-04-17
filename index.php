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
    
    <link rel="stylesheet" type="text/css" href="css/default.css">
</head>
<body ng-controller="mainController">
	<nav class="navbar navbar-default navbar-fixed-top" ng-controller="NavController as nav" ng-cloak>
		<div class="navbar-header">
			<button aria-controls="navbar" aria-expanded="false" data-target="#navbar" data-toggle="collapse" class="navbar-toggle collapsed" type="button">
			<span class="sr-only">Toggle navigation</span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
			</button>
			<a href="#" class="navbar-brand"><img src="images/logo.svg" />FMF <span class="light">CORE</span></a>
		</div>
		<div class="collapse navbar-collapse" id="navbar">
			<ul class="nav navbar-nav" ng-repeat="link in nav.links">
                <li ng-class="{disabled: link.disabled, active: nav.isSet($index) }">
                    <a title="{{link.title}}" href="{{link.url}}" ng-click="link.isDisabled || nav.navClick($index)" >{{link.name}}</a>
                </li> 
			</ul>
            <span class="logged-user" ng-show="username">logged in as: {{username}}</span>

        </div>
    </nav>
    <div class="alert alert-success" ng-show="flash.getMessage()" ng-cloak>
        <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
        <span class="sr-only">Error:</span>
        {{flash.getMessage()}}
    </div>
    <div id="loading-spinner" class="alert">
        <p>Loading, please wait.</p>
        <img src="images/loader.gif" />
    </div>
    <div ng-view ng-cloak></div>

    <?php
        require_once 'src/custom/functions.php';

        //HTML page start
        echo '<!DOCTYPE HTML><html>';
        echo '<head>';
        echo '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
        echo '<title>Login with Google</title>';
        echo '</head>';
        echo '<body>';
        echo '<h1>Login with Google</h1>';

        if(isset($authUrl)) //user is not logged in, show login button
        {
            echo '<a class="login" href="'.$authUrl.'">CLICK HERE</a>';
        }
        else // user logged in
        {
            /* connect to database using mysqli */
            $mysqli = new mysqli($hostname, $db_username, $db_password, $db_name);

            if ($mysqli->connect_error) {
                die('Error : ('. $mysqli->connect_errno .') '. $mysqli->connect_error);
            }

            //compare user id in our database
            $user_exist = $mysqli->query("SELECT COUNT(google_id) as usercount FROM google_users WHERE google_id=$user_id")->fetch_object()->usercount;
            if($user_exist)
            {
                echo 'Welcome back '.$user_name.'!';
            }else{
                //user is new
                echo 'Hi '.$user_name.', Thanks for Registering!';
                $mysqli->query("INSERT INTO google_users (google_id, google_name, google_email, google_link, google_picture_link)
            VALUES ($user_id, '$user_name','$email','$profile_url','$profile_image_url')");
            }


            echo '<br /><a href="'.$profile_url.'" target="_blank"><img src="'.$profile_image_url.'?sz=100" /></a>';
            echo '<br /><a class="logout" href="?reset=1">Logout</a>';

            //list all user details
            echo '<pre>';
            print_r($user);
            echo '</pre>';
        }

        echo '</body></html>';
    ?>

    <!-- loading scripts -->
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular.js"></script>
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular-cookies.js"></script>
    <script type="text/javascript" src="//code.angularjs.org/1.3.14/angular-route.js"></script>

    <script type="text/javascript" src="//code.jquery.com/jquery-1.11.2.min.js"></script>
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>

    <!-- general functions -->    
    <script type="text/javascript" src="js/js.functions.js"></script>
    
    <!-- angularJS scripts -->
    <script type="text/javascript" src="js/ng.app.js"></script>

</body>
</html>

