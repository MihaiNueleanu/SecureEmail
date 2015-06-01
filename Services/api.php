<?php
require_once("Rest.inc.php");
include 'ChromePhp.php';

class API extends REST {

    public $data = "";

    const DB_SERVER = "127.0.0.1";
    const DB_USER = "root";
    const DB_PASSWORD = "";
    const DB = "secureemail";

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
                $sql = "INSERT INTO secureemail.credentials (uid, ps, ph, pubkey, privkey) VALUES ('".$uid."','".$ps."','".$ph."','".$pubkey."','".$privkey."')";

                if ($this->mysqli->query($sql) === TRUE) {
                    $success = array('status' => "Success", "msg" => "Customer Created Successfully.", "data" => $uid);
                    $this->response($this->json($success),200);
                } else {
                    $this->response('',204);	//"No Content" status
                }
                $this->mysqli->close();
            }
        }
    }

    private  function bruteForceProtection() {
        $first_failed_login = 0; // retrieve from DB
        $failed_login_count = 0; // retrieve from DB
        $bad_login_limit = 0;
        $lockout_time = 10;
        if(
            ($failed_login_count >= $bad_login_limit)
            &&
            (time() - $first_failed_login < $lockout_time)
        ) {
            echo "You are currently locked out.";
            exit; // or return, or whatever.
        } else if(true) { /* login is invalid-true todo make it work */
            if( time() - $first_failed_login > $lockout_time ) {
                // first unsuccessful login since $lockout_time on the last one expired
                $first_failed_login = time(); // commit to DB
                $failed_login_count = 1; // commit to db
            } else {
                $failed_login_count++; // commit to db.
            }
            exit; // or return, or whatever.
        } else {
            // user is not currently locked out, and the login is valid.
            // do stuff
        }
    }

    private function getKeyPair(){
        $uid = (string)$_GET['uid'];
        $ps = (string)$_GET['ps'];
        $ph = (string)$_GET['ph'];

        if(!empty($uid) and !empty($ps) and !empty($ph) ){
            $sql = "SELECT pubkey, privkey FROM secureemail.credentials WHERE uid = '".$uid."' AND ph = '".$ph."' LIMIT 1";
            $r = $this->mysqli->query($sql) or die($this->mysqli->error.__LINE__);

            if($r->num_rows > 0) {
                $result = $r->fetch_assoc();
                //ChromePhp::log("REST-API: GOT THIS: " . $this->json($result));
                $this->response($this->json($result), 200);
            } else {
                $this->response('', 204);	// If no records "No Content" status
            }
            $this->mysqli->close();
        }
    }

    private function getPublicKey(){
        $uid = (string)$_GET['uid'];

        if(!empty($uid)){
            $sql = "SELECT pubkey FROM secureemail.credentials WHERE uid = '".$uid."' LIMIT 1";
            $r = $this->mysqli->query($sql) or die($this->mysqli->error.__LINE__);

            if($r->num_rows > 0) {
                $result = $r->fetch_assoc();
                //ChromePhp::log("REST-API: GOT THIS: " . $this->json($result));
                $this->response($this->json($result), 200);
            } else {
                $this->response('', 204);	// If no records "No Content" status
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