/**
 * Created by chancet1982 on 2015-05-18.
 */


/*get current user returns user ID in form of mail*/
//TODO change userID to work on the real userID
function getUserId() {
    return "chancet1982@gmail.com";
}

/*get current user returns passphrase as string*/
//TODO getPassphrase
function getPassphrase(userId) {
    var userId = userId;
    return "7890uiOP";
}

/*get current user returns passphrase as string*/
//TODO getPublicKey
function getPublicKey(userId) {
    var userId = userId;
    return "7890uiOP";
}


var key = getKey(userID);
var publicKey = openpgp.key.readArmored(key);
var privateKey = openpgp.key.readArmored(key).keys[0];
openpgp.encryptMessage(publicKey.keys, 'Hello, World!').then(function(pgpMessage) {
    // success
}).catch(function(error) {
    // failure
});




privateKey.decrypt('passphrase');
var pgpMessage = '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----';
pgpMessage = openpgp.message.readArmored(pgpMessage);
openpgp.decryptMessage(privateKey, pgpMessage).then(function(plaintext) {
    // success
}).catch(function(error) {
    // failure
});