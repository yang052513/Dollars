$(document).ready(function () {

    //用户发送信息时间
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes();
    var dateTime = date + ' ' + time;
    console.log("现在的时间" + dateTime);

    //用户发送信息
    $("#post-btn").click(function () {
        var userMsg = $("#user-input").val();

        let user_chat = $("<div class=user-chat>" +
            "<img class=user-chat-profile src=Img/user/default-1.jpg>" +
            "<div class=user-chat-content-wrap>" +
            "<p class=user-chat-user>" +
            "<span class=user-name>NickBOOM </span>" +
            "<span class=user-date>" + dateTime + "</span>" +
            "</p>" +
            "<p class=user-chat-content>" + userMsg + "</p>" +
            "</div>" +
            "</div>");

        $(".main-room-chat").append(user_chat);
        $('input[type="text"], textarea').val('');

        setTimeout(function () {
            ($('.main-room-chat').children(".user-chat:last-child")[0]).scrollIntoView();
        },100);
    });
});