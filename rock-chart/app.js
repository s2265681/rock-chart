const app = require("express")();
const server = require("http").Server(app);
const moment = require("moment");
var UUID = require("uuid");

const io = require("socket.io")(server);

app.get("/", (req, res) => {
  // 重定向到首页
  res.redirect("/login.html");
});

let users = []; // 记录当前所有用户信息 { avatar: "",id: "", username: "", count: 0} count 未读消息数量
let messageList = []; // 存放消息 { avatar: "", id: "1", username: "沉默王二", data_time: "12:00", message: "你好啊，重阳微噪", fromWho:'' , toWho:'大厅' , to '' }
// let sockets = [];

const checkToken = function (userId, socket) {

  let userInfoform = users.find((el) => el.id === userId);
  if (userInfoform) {
    // console.log(userInfoform.id, "返回用户信息");
    socket.userId = userInfoform.id;
    socket.username = userInfoform.username;

    socket.emit("loginSuccess", userInfoform, users, messageList);
  } else {
    // console.log("返回用户没有权限");
    socket.emit("loginFail", "该用户没有权限,请重新登陆!");
  }
};

// 连接io
io.on("connect", (socket) => {
  let userId = socket.handshake.query.userId;

  // 当前用户刷新，返回数据信息
  if (userId) checkToken(userId, socket);

  socket.on("login", (userInfoform) => {
    if (users.find((el) => el.username === userInfoform.username))
      return socket.emit("loginFail", "用户名重复，请重新登陆！");
    //    console.log(socket.id,'socket.id>>>>')
    // sockets.push(socket.id)
    socket.userId = userInfoform.id;
    socket.username = userInfoform.username;
    
    userInfoform.data_time = new Date().toLocaleString();
    users.push(userInfoform);
    // 推送登陆成功 更新自己
    socket.emit("loginSuccess", userInfoform, users, messageList);
    // socket.broadcast.emit 加入通知 除去自己
    socket.broadcast.emit("notify", userInfoform);
    // 更新用户列表
    io.emit("updateUserList", users);
  });

  // 退出连接
  const disconnect = (userInfo) => {
    let userId = socket.handshake.query.userId;
    socket.broadcast.emit("sockedloginOut", userInfo.username);
    users = users.filter((item) => item.id !== userId);
    // 更新用户列表
    io.emit("updateUserList", users);
    if (users.length === 0) {
      users = [];
      messageList = [];
    }
  };

  //监听用户断开连接  和用户主动退出 刷新保留 非正常情况下 退出不能更新了
  //   socket.on("disconnect", disconnect);
  socket.on("loginOut", disconnect);
  // 接收消息 发送给所有人 参数第一个 谁发的 第二个 发给谁  第三个具体信息  第四个 是所有人信息还是私聊 everyone|someone
  socket.on(
    "to send msg",
    (userInfo, toWho, message, sockedType = "everyone") => {
      let newMsg = {
        ...userInfo,
        toWhoId: toWho.id,
        toWho,
        message,
        uuid: UUID.v1(),
        isRead: 0, // 所有消息都是未读的
        data_time: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
      };
      messageList.push(newMsg);
      if (sockedType === "everyone")
        io.emit("receviedMessage", toWho, messageList);
      if (sockedType === "someone")
        io.to(userInfo.id).emit("receviedMessage", toWho, messageList);
        // console.log(userInfo.id,toWho.id)
        // console.log(users,'userssss')
        // console.log(socket.userId)
         //广播向所有socket连接
        // socket.broadcast.emit('receviedMessage',userInfo,messageList);
        //给自己也发一份
        // socket.emit('receviedMessage',toWho, messageList);
        // socket.to(userInfo.id).emit("receviedMessage", toWho, messageList);
        // io.to(userInfo.id).to(toWho.id).emit("receviedMessage", toWho, messageList);
    }
  );

  // 处理谁正在输入...
  socket.on("is inputing", (userInfo, toWho) => {
    console.log(toWho.id,userInfo.id)
    io.to(toWho.id).emit("isInputting", userInfo, toWho);
  });

  // 断开连接
  socket.on("error", (reason) => {
    console.log(reason + "发生错误");
  });

});

//处理静态资源,把public目录设置为静态资源
app.use(require("express").static("public"));

server.listen("3000", function () {
  console.log("服务启动在3000");
});
