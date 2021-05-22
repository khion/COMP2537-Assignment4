'use strict'
$(document).ready(function() {

    function getMessages() {
        $.ajax({
            url: "/get-messages",
            dataType: "json",
            type: "GET",
            success: function (data) {
                for (let i = 0; i < data.rows.length; i++) {
                    let row = data.rows[i];
                    let beginTag = "<p style='color: green'>";
                    if (row.sender == $("#name").html()) {
                        beginTag = "<p style='color: darkblue'>";
                    }
                    $("#chat_content").append(beginTag + row.sender + " said: " + row.mess + "</p>");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR:", jqXHR, textStatus, errorThrown);
            }
        });
    }
    getMessages();

    let socket = io.connect('/');


            socket.on('user_joined', function(data) {
                let beginTag = "<p style='color: orange;'>";
                let numOfUsers = data.numOfUsers;
                let userStr = "";
                if(numOfUsers == 1) {
                    userStr = "user";
                } else {
                    userStr = "users";
                }
                if(numOfUsers < 2) {

                    $("#chat_content").append("<p style='color: red'>Just you, no one else.</p>");

                } else {

                    $("#chat_content").append(beginTag + data.user
                        + " connected. There are " + numOfUsers + " " + userStr + ".</p>");

                }

            });

            socket.on('user_left', function(data) {
                let beginTag = "<p style='color: burlywood;'>";
                let numOfUsers = data.numOfUsers;
                let userStr = "";
                if(numOfUsers == 1) {
                    userStr = "user";
                } else {
                    userStr = "users";
                }
                if(numOfUsers < 2) {

                    $("#chat_content").append("<p style='color: black'>" + data.user + " left. You are now all alone on this chat server <span style='font-size: 1.2em; color: blue;'>☹</span>.</p>");


                } else {

                    $("#chat_content").append(beginTag + data.user
                        + " left. Now chatting with " + numOfUsers + " " + userStr + "</p>");

                }

            });

            // this is from others - not our text
            socket.on('chatting', function(data) {
                //console.log(data);
                let me = $("#name").html();
                let beginTag = "<p style='color: green'>";
                if(me == data.user) {
                    beginTag = "<p style='color: darkblue;'>";
                }
                $("#chat_content").append(beginTag + data.user + " said: " + data.text + "</p>");

            });


            $("#send").click(function() {

                let name = $("#name").html();
                let text = $("#msg").val();
                let textWithEmoji = text.replace(":)", "☺");

                // check if the name is blank, shouldn't be
                if(name == null || name === "") {
                    $("#name").fadeOut(50).fadeIn(50).fadeOut(50).fadeIn(50);
                    return;
                }
                if(text == null || text === "") {
                    $("#msg").fadeOut(50).fadeIn(50).fadeOut(50).fadeIn(50);
                    return;
                }
                socket.emit('chatting', {"name": name, message: textWithEmoji});
                $("#msg").val("");
            });

            $("#revealChatButton").click(function () {
                $("#container").css("display", "block");
                $("#headerTitle").css("display", "none");
                $(".creatorNames").css("display", "none");
                $("#revealChatButton").css("display", "none");
                // Adapted from https://stackoverflow.com/questions/18614301/keep-overflow-div-scrolled-to-bottom-unless-user-scrolls-up
                let element = document.getElementById("chat_content");
                element.scrollTop = element.scrollHeight;
            });
            
            $("#closeChatButton").click(function () {
                $("#container").css("display", "none");
                $("#headerTitle").css("display", "inline-block");
                $(".creatorNames").css("display", "block");
                $("#revealChatButton").css("display", "block");
            });

            
});