'use strict';
$(document).ready(function () {

    $("#submit").click(function () {
        $.ajax({
            url: "/authenticate",
            type: "POST",
            dataType: "JSON",
            data: {
                email: $("#email").val(),
                password: $("#password").val()
            },
            success: function (data) {
                //console.log("Data returned from server: ", data);
                if (data['status'] == "success") {
                    // redirect
                    window.location.replace("/main");
                } else {
                    // show error message
                    $("#errorMsg").html(data['msg']);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $("body").text(jqXHR.statusText);
            }
        });
    });
});