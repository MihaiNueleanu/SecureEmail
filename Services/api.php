<?php
require_once("Rest.inc.php");
include 'ChromePhp.php';

class API extends REST {

    public $data = "";

    //Local settings
    /*const DB_SERVER = "127.0.0.1";
    const DB_USER = "root";
    const DB_PASSWORD = "";
    const DB = "secureemail";*/

    /*7appstudio.com.mysql*/
    //Production settings
    const DB_SERVER = "255.255.255.255:3306";
    const DB_USER = "examplename";
    const DB_PASSWORD = "12345678";
    const DB = "examplename";

    private $db = NULL;
    private $mysqli = NULL;
    public function __construct(){
        //ChromePhp::log('REST-API: Construct');
        parent::__construct(); // Init parent contructor
        $this->dbConnect(); // Initiate Database connection
    }

    /*Connect to Database */
    private function dbConnect(){
        $this->mysqli = new mysqli(self::DB_SERVER, self::DB_USER, self::DB_PASSWORD, self::DB);
        //ChromePhp::log('REST-API: Database connection created');
    }

    /* Dynmically call the method based on the query string */
    public function processApi(){
        $func = strtolower(trim(str_replace("/","",$_REQUEST['x'])));
        if((int)method_exists($this,$func) > 0)
            $this->$func();
        else
            $this->response('',404); // If the method not exist with in this class "Page not found".
    }

    private function createAccount(){
        if($this->get_request_method() != "POST"){
            $this->response('',406);
        } else {
            $args = json_decode(file_get_contents('php://input'));

            $uid = (string)$args->uid;
            $ps = (string)$args->ps;
            $ph = (string)$args->ph;
            $pubkey = (string)$args->pubkey;
            $privkey = (string)$args->privkey;

            if(!empty($uid) and !empty($ps) and !empty($ph) and !empty($pubkey) and !empty($privkey)){
                $sql = "INSERT INTO 7appstudio_com.credentials (uid, ps, ph, pubkey, privkey) VALUES ('".$uid."','".$ps."','".$ph."','".$pubkey."','".$privkey."')";

                if ($this->mysqli->query($sql) === TRUE) {
                    $success = array('status' => "success", "msg" => "user created successfully.", "data" => $uid);
                    $this->response($this->json($success),200);
                } else {
                    $error = array('status' => "error", "msg" => "user already exists and cannot be created.", "data" => $uid);
                    $this->response($this->json($error),404);	//"No Content" status
                }
                $this->mysqli->close();
            }
        }
    }

    //TODO test bruteforce protection, add frontend reaction to the response.
    private  function getKeyPair() {
        $uid = (string)$_GET['uid'];
        $ps = (string)$_GET['ps'];
        $ph = (string)$_GET['ph'];
        $bad_login_limit = 5;
        $lockout_time = 10*60; //10 what?

        /* Getting the first failed log attempt and the failed log count*/
        if(!empty($uid)){
            $sql = "SELECT ffLogTime,fLogCount FROM 7appstudio_com.credentials WHERE uid = '".$uid."' LIMIT 1";
            $r = $this->mysqli->query($sql) or die($this->mysqli->error.__LINE__);

            if($r->num_rows > 0) {
                $result = $r->fetch_assoc();
                $ffLogTime =  current($result);
                $fLogCount = end($result);
            } else {
                $ffLogTime = null;
                $fLogCount = null;
            }
        }

        /* if user is "locked out" - failed attempts exceeded limit and time limit not exceeded */
        if(($fLogCount >= $bad_login_limit) && (strtotime(date('Y-m-d H:i:s')) - strtotime($ffLogTime) < $lockout_time)) {
            //ChromePhp::log("REST-API:(user is locked out)");
            $error = array('status' => "error", "message" => "user is currently locked out of the system", "data" => $uid);
            $this->response($this->json($error), 404);	// If no records "No Content" status

        /* user is not! "locked out" */
        } else {
            if(!empty($uid) and !empty($ps) and !empty($ph) ){
                //ChromePhp::log("REST-API:(user is not locked out) uid: " . $uid ."ph: " .$ph);
                $sql = "SELECT pubkey, privkey FROM 7appstudio_com.credentials WHERE uid = '".$uid."' AND ph = '".$ph."' LIMIT 1";
                //ChromePhp::log("REST-API: GOT THIS: " . $this->json($result));
                $r = $this->mysqli->query($sql) or die($this->mysqli->error.__LINE__);

                if($r->num_rows > 0) {
                    /* login success and keypair found */
                    $result = $r->fetch_assoc();
                    $this->response($this->json($result), 200);
                } else {
                    //ChromePhp::log("REST-API:(user is not locked out) PASSPHRASE MISSMATCH!");
                    if( (strtotime(date('Y-m-d H:i:s')) - strtotime($ffLogTime)) > $lockout_time ) {
                        //ChromePhp::log("REST-API: FIRST TIME?: ". (strtotime(date('Y-m-d H:i:s')) - strtotime($ffLogTime)));
                        /* first unsuccessful login since $lockout_time on the last one expired */
                        $ffLogTime = date('Y-m-d H:i:s');
                        $fLogCount = 1;
                        //ChromePhp::log("REST-API:(user is not locked out) PASSPHRASE MISSMATCH! ffLogTime: ".$ffLogTime);
                        $sql = "UPDATE 7appstudio_com.credentials SET ffLogTime='".$ffLogTime."', fLogCount='".$fLogCount."' WHERE uid = '".$uid."'";
                        if ($this->mysqli->query($sql) === TRUE) {
                            $error = array('status' => "error", "message" => "logged first failed login data to database.", "data" => $uid);
                        } else {
                            $error = array('status' => "error", "message" => "Error while logging: first failed login data to database.", "data" => $uid);
                        }

                    } else {
                        //ChromePhp::log("REST-API: YET ANOTHER TIME ". (strtotime(date('Y-m-d H:i:s')) - strtotime($ffLogTime)));
                        /* yet another unsuccessful login since */
                        $fLogCount ++; // commit to db.

                        $sql = "UPDATE 7appstudio_com.credentials SET fLogCount='".$fLogCount."' WHERE uid = '".$uid."'";
                        if ($this->mysqli->query($sql) === TRUE) {
                            $error = array('status' => "error", "message" => "logged yet another failed login.", "data" => $uid);
                        } else {
                            $error = array('status' => "error", "message" => "Error while logging: yet another failed login.", "data" => $uid);
                        }
                    }
                    //ChromePhp::log("REST-API: ".$this->json($error));
                    $this->response($this->json($error), 404);	// If no records "No Content" status
                }
                $this->mysqli->close();
            }

        }
    }

    private function getPublicKey(){
        $uid = (string)$_GET['uid'];

        if(!empty($uid)){
            $sql = "SELECT pubkey FROM 7appstudio_com.credentials WHERE uid = '".$uid."' LIMIT 1";
            $r = $this->mysqli->query($sql) or die($this->mysqli->error.__LINE__);

            if($r->num_rows > 0) {
                $result = $r->fetch_assoc();
                //ChromePhp::log("REST-API: GOT THIS: " . $this->json($result));
                $this->response($this->json($result), 200);
            } else {
                $error = array('status' => "error", "message" => "user does not exist or does not have a key pair", "data" => $uid);
                $this->response($this->json($error),501);	//"No Content" status
            }
            $this->mysqli->close();
        }
    }

    private function json($data){
        if(is_array($data)){
            return json_encode($data);
        }
    }
}

/* Initiiate Library*/
$api = new API;
$api->processApi();
?>
