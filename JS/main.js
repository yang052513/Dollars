$(document).ready(function () {

    var db = firebase.firestore();

    //当发送新的消息时, 初始化空的标签数组 Initialize tag array when new chat sent
    var tag = [];


    firebase.auth().onAuthStateChanged(function (user) {
        db.collection("user").doc(user.uid)
            .set({
                "Online": true,
            }, {
                merge: true
            });
    });


    //用户发送信息时间 Get the current time
    var today = new Date();
    var month = today.getMonth();
    var day = today.getDate();
    var hour = today.getHours();
    var minute = today.getMinutes();
    var second = today.getSeconds();

    //样式化时间格式 2020-09-02 08:02:01 Style time format
    //If less than 10, add 0 before
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
    console.log("现在的小时" + hour);

    //用户发送信息 User send message
    firebase.auth().onAuthStateChanged(function (user) {
        db.collection("user")
            .doc(user.uid)
            .set({
                "name": user.displayName,
            }, {
                merge: true
            });

        var userPhoto;

        if (user.photoURL == null) {
            userPhoto = "default-1.jpg";
        } else {
            userPhoto = user.photoURL;
        }

        $(".current-user-name").html(user.displayName);
        $("#user-btn").attr("src", "Img/user/" + userPhoto);

        //用户发送新的信息 write message to firebase
        $("#user-input").keyup(function (event) {
            var userMsg = $("#user-input").val();
            var userName = user.displayName;

            if (user.photoURL == null) {
                userPhoto = "default-1.jpg";
            } else {
                userPhoto = user.photoURL;
            }

            if (event.keyCode == 13) {
                if (userMsg.trim() == '') {
                    $("#zero-msg-modal").fadeIn();
                } else {
                    $('input[type="text"], textarea').val('');
                    //用户信息写入到firebase
                    var docMsg = {
                        User: userName,
                        Date: dateTime,
                        Chat: userMsg,
                        Profile: userPhoto,
                        Tag: tag,
                    };

                    db.collection("chatRoom").add(docMsg);
                }
            }
        });
    });

    //当前在线人员的数量和信息
    let online_member_count = 0;
    var other_user_profile;
    var user_status;
    firebase.auth().onAuthStateChanged(function (user) {
        db.collection("user").orderBy("name", "desc").onSnapshot(function (snap) {
            snap.docChanges().forEach(function (change) {
                var other_user_name = change.doc.data().name;

                if (change.doc.data().profile == null) {
                    other_user_profile = "default-1.jpg";
                } else {
                    other_user_profile = change.doc.data().profile;
                }


                if (change.doc.data().Online == true) {
                    user_status = "online-status.png";
                } else {
                    user_status = "offline-status.png";
                }

                //生成DOM对象
                var user_wrap = $("<div id=" + change.doc.id + " class=user-wrap>" +
                    "<img class=user-profile-img id=user-btn src=Img/user/" + other_user_profile + ">" +
                    "<div class=current-user-info>" +
                    "<img class=user-online-status src=Img/" + user_status + " width=12px height=12px>" +
                    "<p class=other-user-name>" + other_user_name + "</p>" +
                    "</div>" +
                    "</div>");

                if (change.type == "added") {
                    $(".online-member-text").after(user_wrap);
                    online_member_count++;
                    console.log("新的" + change.doc.data().name);
                } else if (change.type == "modified") {
                    $("#" + change.doc.id + " .user-profile-img").attr("src", "Img/user/" + change.doc.data().profile);
                    $("#" + change.doc.id + " .user-online-status").attr("src", "Img/" + user_status);
                    console.log("修改的" + change.doc.data().name);
                }

                console.log(online_member_count);
                $("#online-member-count").html(online_member_count);
            });
        });
    });

    //用户登陆成功后显示chatroom所有chat Display all the history chat 
    firebase.auth().onAuthStateChanged(function (user) {
        db.collection("chatRoom").orderBy("Date", "asc").onSnapshot(function (snap) {
            snap.docChanges().forEach(function (change) {
                var userNameCloud = change.doc.data().User;
                var dateCloud = change.doc.data().Date;
                var chatCloud = change.doc.data().Chat;
                var profileCloud = change.doc.data().Profile;

                //DOM信息对象 HTML element 
                let user_chat = $("<div class=user-chat>" +
                    "<img class=user-chat-profile src=Img/user/" + profileCloud + ">" +
                    "<div class=user-chat-content-wrap>" +
                    "<p class=user-chat-user>" +
                    "<span class=user-name>" + userNameCloud + "</span>" +
                    "<span class=user-date>" + dateCloud + "</span>" +
                    "</p>" +
                    "<p class=user-chat-content>" + chatCloud + "</p>" +
                    "</div>" +
                    "<div class=user-chat-hover-modal>" +
                    "<i class='fas fa-tags add-tag'></i>" +
                    "</div>" +
                    "<div class=user-chat-add-tag-modal>" +
                    "<input class=add-tag-input type=text placeholder=type here...>" +
                    "<i class='fas fa-check-square submit-tag'></i>" +
                    "<i class='fas fa-minus-circle cancel-tag'></i>" +
                    "</div>" +
                    "</div>");

                //用户的反应父级class
                let user_chat_reaction = $("<div class=user-chat-reaction></div>");
                let user_chat_wrap = $("<div id=" + change.doc.id + " class=user-chat-wrap></div>").on();
                $(user_chat_wrap).append(user_chat, user_chat_reaction);

                //如果有新的信息发送 写入到html
                //循环所有tag
                if (change.type == "added") {
                    $(".main-room-chat").append(user_chat_wrap);

                    for (var i = 0; i < change.doc.data().Tag.length; i++) {
                        $("#" + change.doc.id).find(".user-chat-reaction").append($("<button class=reaction-tag>" +
                            "<span class=reaction-tag-content>" + change.doc.data().Tag[i] + "</span>" +
                            "</button>"));
                    }

                    //如果有新的tag加入到信息中
                } else if (change.type == "modified" && change.doc.data().Tag[change.doc.data().Tag.length - 1] != null) {
                    var lastValue = change.doc.data().Tag.length - 1
                    $("#" + change.doc.id).find(".user-chat-reaction").append($("<button class=reaction-tag>" +
                        "<span class=reaction-tag-content>" + change.doc.data().Tag[lastValue] + "</span>" +
                        "</button>"));
                    console.log(change.doc.data());
                }

                //回滚到最新的信息
                setTimeout(function () {
                    ($('.main-room-chat').children(".user-chat-wrap:last-child")[0]).scrollIntoView();
                }, 100);
            });
        });
    });

    // 创建用户缩略图DOM并生成
    for (var i = 1; i <= 70; i++) {
        var profile_pic = $("<img id=profile-" + i + " class=profile-pic src=Img/user/profile-" + i + ".jpg></img>");
        $(".profile-pic-wrap").append(profile_pic);
    }

    //显示用户头像更改界面
    $("#profile-btn").click(function () {
        $("#profile-pic-modal").fadeIn();
    });

    //点击头像并更改 更改后modal退出
    firebase.auth().onAuthStateChanged(function (user) {
        var profile_pic_path;

        $(".profile-pic").click(function () {
            profile_pic_path = $(this).attr("id") + ".jpg";
            $("#user-btn").attr("src", "Img/user/" + profile_pic_path);

            var current_user = firebase.auth().currentUser;

            current_user.updateProfile({
                photoURL: profile_pic_path
            }).then(function () {
                console.log("user profile change successfully");
            }).catch(function (error) {
                console.log("cannot update user profile picture");
            });

            db.collection("user").doc(user.uid).set({
                profile: profile_pic_path,
            }, {
                merge: true
            });
            $("#profile-pic-modal").fadeOut();
        });

    });

    //退出选择头像modal
    $("#profile-modal-return-btn").click(function () {
        $("#profile-pic-modal").fadeOut();
    });

    //退出主题modal
    $("#theme-modal-return-btn").click(function () {
        $("#theme-change-modal").fadeOut();
    });

    //点击主题按钮 打开主题modal
    $("#theme-btn").click(function () {
        $("#theme-change-modal").fadeIn();
    });

    //Primary Color: 左侧导航栏，聊天信息发送区域，聊天室标题
    var primary_color;
    //Secondary Color: 左侧用户信息栏，聊天室背景色
    var secondary_color;

    //本地DOM更改左侧导航栏， 聊天室header， 以及发送信息区域颜色
    function primaryColorChange(primarycolor) {
        $(".side-nav-bar, .main-room-header, textarea").css({
            "background-color": primarycolor,
            "transition": "background-color 0.5s"
        });
    }

    //本地DOM更改左侧信息栏以及主聊天室背景色
    function secondaryColorChange(secondarycolor) {
        $(".side-info-bar, .main-room").css({
            "background-color": secondarycolor,
            "transition": "background-color 0.5s"
        });
    }

    //点击自定义颜色主题
    firebase.auth().onAuthStateChanged(function (user) {
        $("#custom-theme-btn").click(function () {
            console.log("用户选择的主色调为" + $("#primary-color").val());
            console.log("用户选择的副色调为" + $("#secondary-color").val());

            primary_color = $("#primary-color").val();
            secondary_color = $("#secondary-color").val();
            primaryColorChange(primary_color);
            secondaryColorChange(secondary_color);

            //Firebase云端设置用户的主题方案
            db.collection("user").doc(user.uid).set({
                PrimaryColor: primary_color,
                SecondaryColor: secondary_color,
            }, {
                merge: true
            });
        });
    });

    //用户选择主题色
    firebase.auth().onAuthStateChanged(function (user) {
        db.collection("user").doc(user.uid).onSnapshot(function (snap) {
            primaryColorChange(snap.data().PrimaryColor);
            secondaryColorChange(snap.data().SecondaryColor);
            console.log(snap.data().PrimaryColor);
        });

        $(".theme-choice").click(function () {
            var user_choice = $(this).attr("id");

            if (user_choice == "theme-1") {
                primary_color = "#00161d";
                secondary_color = "#13454e";
            } else if (user_choice == "theme-2") {
                primary_color = "#2c2933";
                secondary_color = "#413f47";
            } else if (user_choice == "theme-3") {
                primary_color = "#86634d";
                secondary_color = "#a68068";
            } else if (user_choice == "theme-4") {
                primary_color = "#204042";
                secondary_color = "#5e6f66";
            } else if (user_choice == "theme-0") {
                primary_color = "rgb(45,45,45)";
                secondary_color = "rgb(33,33,33)";
            }

            primaryColorChange(primary_color);
            secondaryColorChange(secondary_color);

            //Firebase云端设置用户的主题方案
            db.collection("user").doc(user.uid).set({
                PrimaryColor: primary_color,
                SecondaryColor: secondary_color,
            }, {
                merge: true
            });
        });
    });

    //Because documents are added dynamically, have to use on to access DOM
    // 鼠标移动当前信息 显示信息状态栏: 加入tag或者like
    $(document).on("mouseenter", ".user-chat", function () {
        $(this).find(".user-chat-hover-modal").fadeIn();
    });

    $(document).on("mouseleave", ".user-chat", function () {
        $(this).find(".user-chat-hover-modal").fadeOut();
    });

    //点击显示标签modal 输入新的标签
    $(document).on("click", ".add-tag", function () {
        $(this).parent().parent().find(".user-chat-add-tag-modal").fadeIn();
        $(this).parent().parent().find(".user-chat-hover-modal").fadeOut();
        $(this).parent().parent().find(".user-chat-hover-modal").css("visibility", "hidden");
    });

    //加入like到当前信息
    // $(document).on("click", ".add-heart", function () {
    //     let selected_parentRef = $(this).parent().parent().parent();
    //     let user_heart = $("<button class=reaction-tag>" +
    //         "<span class=reaction-tag-content><i class='fas fa-heart show-heart'></i></span>" +
    //         "<span class=reaction-tag-count>1</span></button>");

    //     selected_parentRef.find(".user-chat-reaction").append(user_heart); 
    // });

    //发送新的标签内容 
    firebase.auth().onAuthStateChanged(function (user) {
        $(document).on("click", ".submit-tag", function () {
            let user_tag_input = $(this).prev().val();
            let selected_chat = $(this).parent().parent().parent();

            if ($(this).prev().val().trim() == '') {
                alert('tag内容不能为空');
            } else {
                //更新到选中的数组中
                db.collection("chatRoom").doc(selected_chat.attr('id')).update({
                    Tag: firebase.firestore.FieldValue.arrayUnion(user_tag_input)
                });

                console.log(selected_chat.attr('id'));

                //清空input并退出所有modal
                $('input[type="text"]').val('');
                $(this).parent().fadeOut();
                $(this).parent().parent().find(".user-chat-hover-modal").fadeOut().css("visibility", "visible");
            }
        });
    });

    //用户取消发送标签
    $(document).on("click", ".cancel-tag", function () {
        $(this).parent().fadeOut();
        $(this).parent().parent().find(".user-chat-hover-modal").fadeOut().css("visibility", "visible");
    });

    //退出没有信息发送弹出的modal
    $("#zero-msg-btn").click(function () {
        $("#zero-msg-modal").fadeOut();
    });

    $("#info-btn").click(function () {
        $("#author-info-modal").fadeIn();
    });

    $("#exit-info").click(function () {
        $("#author-info-modal").fadeOut();
    });

    $(".heart").on('click touchstart', function () {
        $(this).toggleClass('is_animating');
    });

    $(".heart").on('animationend', function () {
        $(this).toggleClass('is_animating');
    });

    $(window).bind('beforeunload', function(){ 
        firebase.auth().onAuthStateChanged(function (user) {
            //设置在线状态为false
            db.collection("user")
                .doc(user.uid)
                .set({
                    "Online": false,
                }, {
                    merge: true
                });
    
            firebase.auth().signOut().then(function () {
                // Sign-out successful. Open up the login page
                window.location.replace("index.html");
            }).catch(function (error) {
                console.log("Erros...during signout");
            });
        }); 
    });

    //退出当前用户 Sign out the user from firebase
    $("#logout-btn").click(function () {
        firebase.auth().onAuthStateChanged(function (user) {
            //设置在线状态为false
            db.collection("user")
                .doc(user.uid)
                .set({
                    "Online": false,
                }, {
                    merge: true
                });

            firebase.auth().signOut().then(function () {
                // Sign-out successful. Open up the login page
                window.location.replace("index.html");
            }).catch(function (error) {
                console.log("Erros...during signout");
            });
        });
    });
});


