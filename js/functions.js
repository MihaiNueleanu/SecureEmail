$(function () {
    /*$( document ).ready(function() {*/
    console.log( "ready!" );

    /*slide to signup form*/
    $(document).on( "click","#signupButton", function() {
        console.log("sign me up!");
        $("html, body").animate({ scrollTop: $('#signup').offset().top }, 1000);
    });

    //$('[data-toggle="tooltip"]').tooltip()
    /*});*/
});