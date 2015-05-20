$(function () {
    $( document ).ready(function() {
        console.log( "ready!" );

        $(document).on( "click","#signupButton", function() {
            console.log("sign me up!");
            $("html, body").animate({ scrollTop: $('#signup').offset().top }, 1000);
        });
    });

    /*slide to signup form*/
});