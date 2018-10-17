// JavaScript Document
(function($) {

    // $(window).on("load", function() {
    //     $("#scroll").mCustomScrollbar({
    //         scrollbarPosition: "outside"
    //     });
    // });

    /*$(".link-notification").click(function(){
    $(".box-notificationMenu").toggleClass("show");
    });*/

    $('#myTab a').on('click', function(e) {
        e.preventDefault()
        $(this).tab('show')
    });
})(jQuery);