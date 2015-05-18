/**
 * Created by chancet1982 on 2015-05-18.
 */
var openpgp = require('openpgp');
var encryptedPrivateKey = getKey(userID);

decryptKey()
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