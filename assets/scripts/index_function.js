$("#revealChatButton").click(function () {
    $("#container").css("display", "block");
    $("#headerTitle").css("display", "none");
    $("#revealChatButton").css("display", "none");
});

$("#closeChatButton").click(function () {
    $("#container").css("display", "none");
    $("#headerTitle").css("display", "inline-block");
    $("#revealChatButton").css("display", "block");
});