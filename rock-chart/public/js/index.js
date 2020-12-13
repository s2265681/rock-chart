var socket = io();
var app = new Vue({
  el: "#app",
  data: {
    loginFormVisible: false,
    userInfoform: {
      avatar:
        "https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=2929367867,3674362923&fm=26&gp=0.jpg",
      id: "",
      username: "",
    },
    formLabelWidth: "120px",
    title: "rock chart!",
    active_user: {
      avatar: "",
      id: "METTING",
      username: "大厅",
    },
    chartList: [],
    msgInfo: "",
    meeting: {
      avatar: "./image/avatar2.jpg",
      id: "METTING",
      username: "大厅",
      toWhoId: "METTING",
    },
    defaultMsg: {
      avatar: "./image/avatar2.jpg",
      id: "METTING",
      username: "官方",
      data_time: "12:00",
      message: "欢迎来到聊天室",
      type: 1, // 1 代表左边 我接收的消息  2 代表右边 我发出的消息
      toWho: "ereryOne",
      toWhoId: "METTING",
    },
    newMessageList: [],
    messageList: [],
    chartAreaDomHeight: 345,
    msglistAreaDomHeight: 0,
    chartAreaTop: 0, // 右侧区域据上面的高度
    show: false,
  },
  created() {
    socket.on("loginSuccess", this.loginSuccess);
    socket.on("notify", this.notify);
    socket.on("updateUserList", this.updateUserList);
    socket.on("sockedloginOut", this.sockedloginOut);
    socket.on("receviedMessage", this.receviedMessage);
  },
  mounted() {
    this.msglistAreaDomHeight = this.$refs.message_list_area.clientHeight;
    this.$refs.right_chart_container.addEventListener(
      "scroll",
      this.scrollHander,
      true
    );
  },
  computed: {
    countChartAraeTop: function () {},
    isShowToBottom: function () {
      let chartAreaDomHeight = this.chartAreaDomHeight;
      let msglistAreaDomHeight = this.msglistAreaDomHeight;
      this.show = false;
      if (chartAreaDomHeight + this.chartAreaTop < msglistAreaDomHeight - 30) {
        this.show = true;
      }
      return this.show;
    },
    filterMessageList: function () {
      let msg = [];
      // 大厅情况下
      if (this.active_user.id === "METTING") {
        msg = [
          this.defaultMsg,
          ...this.messageList.filter((el) => el.toWhoId === "METTING"),
        ];
      } else {
        // 非大厅
        // 过滤掉非大厅的
        msg = this.messageList.filter((el) => el.toWhoId !== "METTING");
        // 过滤出我收到的和我发出的
        msg = msg.filter(
          (item) =>
            item.toWhoId === this.userInfoform.id ||
            item.id === this.userInfoform.id
        );
        // 过滤出当前标签 我发出的 和 发给我的
        msg = msg.filter(
          (item) =>
            item.toWhoId === this.active_user.id ||
            item.id === this.active_user.id
        );
      }
      // 处理 收到自己发的消息的时候 滚到最下面
      msg.map((item) => {
        if (
          item.id === this.userInfoform.id &&
          this.active_user.id === item.toWhoId
        ) {
          this.backNewMsg();
        }
      });
      return msg;
    },
  },
  methods: {
    // 登陆
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.loginFormVisible = false;
          this.userInfoform.id = socket.id;
          socket.emit("login", this.userInfoform);
        } else {
          return false;
        }
      });
    },
    // 登陆成功的处理
    loginSuccess() {
      this.$message({
        message: "恭喜你，登陆成功！",
        type: "success",
      });
    },
    // 通知所有用户的消息
    notify(userInfo) {
      this.$message(`${userInfo.username} 加入了聊天室, 找他聊聊吧！`);
    },
    // 更新用户列表
    updateUserList(users) {
      if (this.userInfoform.id) {
        this.chartList = [
          this.meeting,
          ...users.filter((user) => user.id !== this.userInfoform.id),
        ];
        return;
      }
      this.chartList = [
        this.meeting,
        ...users.filter((user) => user.id !== this.userInfoform.id),
      ];
    },
    // 重置表单
    resetForm(formName) {
      this.$refs[formName].resetFields();
    },
    // 退出登陆方法
    loginOut() {
      socket.emit("loginOut", this.userInfoform);
      this.userInfoform = { avatar: "", id: "", username: "" };
      this.$message({ type: "success", message: "退出成功！" });
    },
    // 广播退出消息给其他人
    sockedloginOut(username) {
      this.$message(`${username} 退出了聊天室！`);
    },
    // 处理发送消息
    onKeyDown(event) {
      let evt = window.event || event;
      let sockedType = "everyone"; // 大厅 ereryone or someone 私聊
      let toWho = this.meeting;
      if (evt.keyCode == 13) {
        if (this.active_user.id !== "METTING") {
          sockedType = "someone";
          toWho = this.active_user;
        }
        this.sendMsg(this.userInfoform, sockedType, toWho, this.msgInfo.trim());
        this.msgInfo = "";
        // 重新计算消息高度属性
        this.$nextTick(() => {
          this.msglistAreaDomHeight = this.$refs.message_list_area.clientHeight;
        });
      }
    },
    // 发送消息 sockedType 判断是群发 还是私发 默认群发
    sendMsg(sendUser, sockedType = "everyone", toWho, messageValue) {
      socket.emit("to send msg", sendUser, toWho, messageValue, sockedType);
    },
    // 接收大厅消息
    receviedMessage(toWho, messageList) {
      this.messageList = messageList;
    },
    // 切换聊天对象
    changeChartObj(userInfo) {
      this.active_user = userInfo;
      this.$nextTick(function () {
        this.msglistAreaDomHeight = this.$refs.message_list_area.clientHeight;
      });
      this.backNewMsg();
    },
    // 滑动区域触发
    scrollHander() {
      this.chartAreaTop = this.$refs.right_chart_container.scrollTop;
    },
    // 回到最新
    backNewMsg() {
      this.$nextTick(function () {
        this.$refs.right_chart_container.scrollTo(0, this.msglistAreaDomHeight);
      });
    },
  },
});
