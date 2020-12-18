const mongoose = require("mongoose");

const Schema = mongoose.Schema;


const config ={
    dbUrl:'mongodb://127.0.0.1:27017/chat'
}   

// 定义数据结构
let UserSchema = new Schema({
    username: { type: String },
    avatar: { type: String },
    count: { type: Number },
    data_time: { type: String },
    userId: { type: String },  
    id: { type: String },   // 代表socket id  当前会话
    islogin: { type: Number },
})

// avatar: "", id: "1", username: "沉默王二", data_time: "12:00", message: "你好啊，重阳微噪", fromWho:'' , toWho:'大厅' , to '' }
let MessageSchema = new Schema({
    username: { type: String },
    avatar: { type: String },
    data_time: { type: String },
    message: { type: String },
    fromWho: { type: Object },
    toWho: { type: Object },
    toWhoId: { type: String },  // 当前人的会话id
    id:{ type: String },  // 当前消息的id
    userId:{ type: String },
})

// 注册
let connection = mongoose.createConnection(config.dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 连接数据库
const UserModel = connection.model("User", UserSchema);
const MessageModel = connection.model("Message", MessageSchema);

module.exports = {
  UserModel,
  MessageModel
};
