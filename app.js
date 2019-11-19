var express = require("express");
var app = express();
require("./tools/db");
var bodyParser = require("body-parser");
var ueditor = require("ueditor");
let session = require("express-session");
let MongoStore = require("connect-mongo")(session);
let mongoose = require("mongoose");
let multer = require("multer");
var path = require('path');
const fs=require('fs');

//req.file文件  接受上传的文件
//登陆拦截
//设置中间件
app.use(session({
    resave:false,
    saveUninitialized:false,
    secret:"documentSYS",
    cookie:{
        maxAge: 1000*60*60 // default session expiration is set to 1 hour
    },
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
//跨域设置
/*加载模板文件*/
app.set("view engine","ejs");
app.set("views","views");
app.set("admin","admin");

/*加载静态文件*/
app.use(express.static("public"));
/*中间件必须在路由之前 不然加载不到中间件*/
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());


// 官方例子是这样的 serverUrl: URL + "php/controller.php"  我们要把它改成 serverUrl: URL + 'ue'
// app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function(req, res, next) {
//     //客户端发起请求设置  设置响应类型
//     let actionType = req.query.action;
//     console.log(actionType);
//     //if 判断客户端发起的上传请求类型
//     if(actionType === 'uploadimage' || actionType === 'uploadfile'){
//       //文件类型上传时候的文件存储路径修改 (图片则取image文件目录/文件类型就去file文件目录)
//       let file_url = ``;
//       if (actionType === "uploadfile"){
//           file_url = '/file/ueditor/';
//       }else {
//           let file_url = '/images/ueditor/'; //默认图片的上传地址
//       }
//
//       res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
//       // 这里你可以获得上传图片的信息
//       var foo = req.ueditor;
//       console.log(foo.filename); // exp.png
//       console.log(foo.encoding); // 7bit
//       console.log(foo.mimetype); // image/png
//     }
//     //  客户端发起图片列表请求
//     else if (req.query.action === 'listimage'){
//       var dir_url = '/images/ueditor/'; // 要展示给客户端的文件路径
//       res.ue_list(dir_url) // 客户端会列出 dir_url 目录下的所有图片
//     }
//
//     else if(req.query.action === "listfile") {
//         //要展示给客户端的文件路径
//         var dir_url = '/file/ueditor/';
//         //客户端会列出dir_url目录的所有文件
//         res.ue_list(dir_url);
//     }
//     // 客户端发起其它请求
//     else {
//       res.setHeader('Content-Type', 'application/json');
//       // 这里填写 ueditor.config.json 这个文件的路径
//       // res.redirect('/ueditor/ueditor.config.json')
//       res.redirect('/ueditor/nodejs/config.json');
//   }}));
app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function (req, res, next) {
    //客户端上传文件设置
    var imgDir = '/images/ueditor/';
    var ActionType = req.query.action;
    if (ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
        var file_url = imgDir;//默认图片上传地址
        /*其他上传格式的地址*/
        if (ActionType === 'uploadfile') {
            file_url = '/file/ueditor/'; //附件
        }
        if (ActionType === 'uploadvideo') {
            file_url = '/video/ueditor/'; //视频
        }
        res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
        res.setHeader('Content-Type', 'text/html');
    }
    //  客户端发起图片列表请求
    else if (req.query.action === 'listimage') {
        var dir_url = imgDir;
        res.ue_list(dir_url); // 客户端会列出 dir_url 目录下的所有图片
    }
    // 客户端发起其它请求
    else {
        // console.log('config.json')
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/nodejs/config.json');
    }
}));



app.use(multer({dest: './public/upload'}).any());
//创建一个路由处理session
app.use(function (req,res,next) {
    res.locals.session = req.session;
    next();
});
app.use(function (req,res,next) {
    res.locals.msg = {};
    next();
});
/*路由加载*/
app.use("/admin",require("./routers/admin"));
app.use("/api",require("./routers/api"));
app.use("/",require("./routers/main"));

// 跨域设置
app.all("*", function(req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});
/*body-parser 中间件*/
app.listen(3000,function (err) {
    if(!err){
        console.log("服务器成功启动！！！！！");
    }
});