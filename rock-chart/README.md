```js
    created() {
    socket.on("loginSuccess", this.loginSuccess);
    socket.on("notify", this.notify);
    socket.on("updateUserList", this.updateUserList);
    socket.on("sockedloginOut", this.sockedloginOut);
    socket.on("receviedMessage", this.receviedMessage);
  },
  mounted() {
    this.chartAreaDom = this.$refs.right_chart_container;
    this.chartAreaDom.addEventListener("scroll", this.scrollHander, true);
  },
```
