$(function () {
    /*$( document ).ready(function() {*/
    console.log( "ready!" );

    /*slide to signup form*/
    $(document).on( "click","#signupButton", function() {
        $("html, body").animate({ scrollTop: $('#signup').offset().top }, 1000);
    });
});