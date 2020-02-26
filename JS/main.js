$(document).ready(function () {

    var db = firebase.firestore();

    //用户发送信息时间
    var today = new Date();
    var month = today.getMonth();
    var day = today.getDate();
    var hour = today.getHours();
    var minute = today.getMinutes();
    var second = today.getSeconds();

    //样式化时间格式 2020-09-02 08:02:01
    if (month < 10) {
        month = '0' + (month + 1);
    }

    if (day < 10) {
        day = '0' + day;
    }

    if (hour < 10) {
        hour = '0' + hour;
    }

    if (minute < 10) {
        minute = '0' + minute;
    }

    if (second < 10) {
        second = '0' + second;
    }

    var date = today.getFullYear() + '-' + month + '-' + day;
    var time = hour + ":" + minute + ":" + second;
    var dateTime = date + ' ' + time;
    console.log("现在的时间" + dateTime);


    //用户发送信息 User send message
    firebase.auth().onAuthStateChanged(function (user) {
        db.collection("user")
            .doc(user.uid)
            .set({
                "name": user.displayName,
            }, {
                merge: true
            });

        $(".current-user-name").html(user.displayName);

        $("#user-input").keyup(function (event) {
            var userMsg = $("#user-input").val();
            var userName = user.displayName;

            var x = db.collection("user").doc(user.uid);
         
            if (event.keyCode == 13) {
                if (userMsg == '') {
                    alert("内容不能为空");
                } else {
                    $('input[type="text"], textarea').val('');
                    //用户信息发送到firebase
                    var docMsg = {
                        User: userName,
                        Date: dateTime,
                        Chat: userMsg,
                        // Profile: x,
                    };
                    db.collection("chatRoom").add(docMsg);
                    console.log(x);
                }
            }
        });

    });


    let online_member_count = 0;
    db.collection("user").get().then(function (snap) {
        snap.forEach(function (doc) {
            var other_user_name = doc.data().name;
            var user_wrap = $("<div class=user-wrap>" +
                "<img class=user-profile-img id=user-btn src=Img/user/default-1.jpg>" +
                "<div class=current-user-info>" +
                "<img class=user-online-status src=Img/online-status.png width=12px height=12px>" +
                "<p class=other-user-name>" + other_user_name + "</p>" +
                "</div>" +
                "</div>");

            $(".online-member-text").after(user_wrap);
            online_member_count++;
            console.log(online_member_count);
            $("#online-member-count").html(online_member_count);
        });
    });

    //用户登陆成功后显示chatroom所有chat Display all the history chat 
    firebase.auth().onAuthStateChanged(function (user) {
        db.collection("chatRoom").orderBy("Date", "asc").onSnapshot(function (snap) {
            snap.docChanges().forEach(function (change) {
                var userNameCloud = change.doc.data().User;
                var dateCloud = change.doc.data().Date;
                var chatCloud = change.doc.data().Chat;

                //DOM HTML element 
                let user_chat = $("<div class=user-chat>" +
                    "<img id=current-user-profile class=user-chat-profile src=Img/user/default-1.jpg>" +
                    "<div class=user-chat-content-wrap>" +
                    "<p class=user-chat-user>" +
                    "<span class=user-name>" + userNameCloud + "</span>" +
                    "<span class=user-date>" + dateCloud + "</span>" +
                    "</p>" +
                    "<p class=user-chat-content>" + chatCloud + "</p>" +
                    "</div>" +
                    "</div>");

                //if the new object being added, append to chat room
                if (change.type == "added") {
                    $(".main-room-chat").append(user_chat);
                    console.log("new chat");
                }

                //回滚到最新的信息
                setTimeout(function () {
                    ($('.main-room-chat').children(".user-chat:last-child")[0]).scrollIntoView();
                }, 100);
       
            });
        });
    });


    // 创建用户缩略图DOM并生成
    for(var i = 1; i <= 35; i++) {
        var profile_pic = $("<img id=profile-" + i + " class=profile-pic src=Img/user/profile-" + i + ".jpg></img>");
        $(".profile-pic-wrap").append(profile_pic);
    }

    //显示用户头像更改界面
    $("#profile-btn").click(function() {
        $("#profile-pic-modal").fadeIn();
    });

    //点击头像并更改 更改后modal退出
    firebase.auth().onAuthStateChanged(function (user) {
        var profile_pic_path;

        $(".profile-pic").click(function() {
            profile_pic_path = $(this).attr("id") + ".jpg";
            $("#user-btn").attr("src", "Img/user/" + profile_pic_path);

            db.collection("user").doc(user.uid).set({
                "profile": profile_pic_path,
            }, {
                merge: true
            });
            $("#profile-pic-modal").fadeOut();
        });
       
    });
});