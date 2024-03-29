let express = require("express");
let router = express.Router();
const  fs = require("fs");
let markdown = require('markdown-js');
let User = require("../schemas/User");
let Category = require("../schemas/Category");
let Content = require("../schemas/Content");
let Comment = require('../schemas/Comment');
const pathLib=require('path');
var sha1 = require("sha1");
let  moment = require("moment");

let newName2='';
// api 形式返回功能测试 响应一个JSON数据
var responseJSON = function (res, ret) {
    if (typeof ret === 'undefined') {
      res.json({
          code: '-200',
          msg: '操作失败'
      });
    } else {
      res.json(ret);
    }
};
router.get("/user",function (req,res) {
    res.send("user 模块");
});

router.use(function (req , res , next) {
    res.locals.msg = {};
    next();
});
//判断用户是否登陆
function checklogin(req,res,next) {
//    判断是否登陆
    if(!req.session.loginUser){
        //用户没有登陆，跳转登陆页面
        req.session.loginError = '请登录！！！';
        res.redirect('/login')
    }else{
        next();
    }
}
//登陆方法/*登陆方法实现*/

//注册方法
router.post("/register",function (req,res) {
    var username = req.body.username.trim();
    var password = req.body.password.trim();
    var repassword = req.body.repassword.trim();
    var email = req.body.emaddress.trim();
    //默认用户注册头像
    var imageUrl = '\\upload\\1e7f6e9614774dcd686bc0b9a32fdd10.jpg';
    //判断重复密码正确不
    //创建对象保存错误信息
    var msg = {
        username: username,
        err: "",
        succeed: ""
    };
    if(repassword !== password) {
        msg.err = "两次密码不正确";
        // res.render("node-admin-sys-register",{msg:msg});
        res.redirect('/register');
    }else{
        //插入数据库
        User.create({
            username:username,
            password: sha1(password),
            images:imageUrl,
            emaddress:email
        }, function (err) {
            if (err) {
                msg.err = "用户名已经存在";
                res.render("node-admin-sys-register",{msg:msg});
            } else {
                msg.succeed = "注册成功";
                res.redirect('/login')
            }
        });
    }
});

//登录方法
router.post("/login",function (req,res) {
    let username = req.body.username;
    let password = req.body.password;
    //数据查询用户 和密码正确
    User.findOne({username:username},function (err,user) {
        if(!err && user && user.password ===sha1(password)&&user.isBigadmin===true){
                req.session.loginUser = user;
                //删除session当中的登陆提示信息
                delete req.session.loginError;
                res.render("node-admin-sys-index");
                // res.redirect("/admin/admin?page=1"); 
        }else if(!err && user && user.password ===sha1(password)){
                req.session.loginUser = user;
                //删除session当中的登陆提示信息
                delete req.session.loginError;
                res.redirect("/index");
        }else {
            //删除session当中的登陆提示信息
            delete req.session.loginError;
            res.render("node-admin-sys-login", {msg: {err: "用户名或密码错误！！！！"}, username: username});
        }
    }); 
});

//api接口方式测试
router.get("/loginApi",function (req,res) { 
    // 获取前台页面传过来的参数
    var param = req.query || req.params;
    var userName = param.userName.trim();
    var password = param.password.trim();

    User.findOne({username:userName},function (err,user) {
        var isTrue = false;    
        var _res = res;
        // console.log(sha1(password))
        var userpassword = sha1(password);
        var test = user.password;


        if(userpassword === test){
           isTrue = true;
        }
        var data = {};
        data.isLogin = isTrue; //如果isTrue布尔值为true则登陆成功 有false则失败
        if(isTrue) {
            data.userInfo = {};
            data.userInfo.id = user._id;
            data.userInfo.userName = user.username;
        }
        result = {
            code: 200,
            msg: 'succeed'
        };
        data.result = result;
         // 以json形式，把操作结果返回给前台页面
         responseJSON(_res, data);

    })
 });

//跳转到用户管理页面
router.get("/user_list",checklogin,function (req,res) {
    /*分页实先*/
//每页显示条数
    let  limit = 6;
    //页数
    let page = Number(req.query.page || 1);
    //过滤条数
    let skip = (page -1 ) *limit;
    //总页数初始值
    let pages = 0;
    User.count().then(function (count) {
        //总页数
        pages = Math.ceil(count/limit);
        //最大页数
        page = Math.min(page,pages-1);
        //最小页数
        page = Math.max(page,1);
        User.find({isBigadmin:{$ne:true},live:{$ne:false}}).skip(skip).limit(limit).then(function(users){
            res.render("user",{users:users,
                count:count,
                pages :pages,
                page:page
            });
        })
    });
});
/*检查登陆*/
router.get("/logout",checklogin,function (req,res) {
    //删除session
    req.session.destroy();
    res.redirect("/login");
});
//分类管理,分类展示  分类分页展示
router.get("/catagory",checklogin,function (req,res){
    //每页显示的条数
    let limit = 6;
    //页数
    let page = Number(req.query.page || 1);
    //过滤数目
    let skip = (page-1)*limit;
    //总页数初始化
    let pages = 0;
    //count
    Category.count().then(function (count) {
        //页数
        pages = Math.ceil(count/limit);
        //最大page
        page = Math.min(page,pages);
        //设置最小
        page = Math.max(page,1);
        Category.find({live:true}).skip(skip).limit(limit).then(function (categorys) {
            res.render("category",{
                categorys:categorys,
                count:count,
                pages:pages,
                page:page
            });
        });
    });
});
router.get("/addCategory",checklogin,function (req,res) {
    res.render("addCategory");
});
//添加分类
router.post("/addCategory_content",checklogin,function (req,res) {
    //分类名 输入不能为空 判断分类名是否存在
    //获取用户填写的分类名字
    let name = req.body.name.trim();
    //分类是否为空
    if(name === ''){
        res.render("addCategory",{msg:{err:'分类不能为空!!!!'}});
    }
    //查找数据库中是否有该分类
    Category.findOne({name:name},function (err,categorys) {
        if(categorys){
            //分类存在的情况
            res.render("addCategory",{msg:{err:'该分类已经存在！！！'}});
        }else{
            //分类不存在的情况
            Category.create({name:name},function (err) {
                if(!err) {
                    res.render("addCategory", {msg: {success: '分类添加成功,可继续添加新分类!!'}})
                }else {
                    console.log("插入错误！！！");
                }
            });
        }
    });
});
//删除分类实现
router.get("/delete_category",checklogin,function (req,res) {
    //根据id 修改live 变为伪删除
    let id = req.query.id;
    Category.update({_id:id},{$set:{live:false}},function (err) {
        //重定向到分类页面
        if(!err) {
            res.redirect("/admin/categoryList");
        }
    });
});
//编辑修改分类
router.post("/edit_Category",checklogin,function (req,res) {
    let id = req.body.id;
    let name = req.body.name;
    //修改不能为空值
    if(name===""){
        res.render("category",{msg:{err:"修改的类名字不能为空值!!!!!"}});
    }
    Category.update({_id:id},{$set:{name:name}},function (err) {

        if(!err){
            res.redirect("/admin/catagory?page=1");
        }
    });
});
/*跳转到文章发表页面*/
router.get("/addContent",checklogin,function (req,res) {
    //查询分类显示
    Category.find({live:{$ne:false}},function (err,categorys) {
        res.render("content_post",{categorys:categorys});
    });
});
//上传图片
router.post("/images",checklogin,function (req,res) {
    //上传图片解析问题
    // console.log(req.files);
    //新文件名字
     let newName  = req.files[0].path + pathLib.parse(req.files[0].originalname).ext;
     newName2 = newName.substring(6);
     //{"imgName":newName2} 定义个空数组
    if (!req.session.img){
        var img = [];
        //将文件名添加到数组中
        img.push(newName2);
    } else{
        var img = req.session.img;
        img.push(newName2);
    }
    // console.log(req.files);
    fs.rename(req.files[0].path,newName,function (err) {
        if(err){
            res.err = "上传失败！！";
        }else {
            //数组存到session中
            if (!req.session.img){
                req.session.img = img;
            }
            //重定向到添加页面
                res.redirect("/admin/contentEdit");
        }
    });
});
/*发布文章页面-表单*/
router.post("/add",checklogin,function (req,res) {
    let category = req.body.category;
    let title = req.body.title.trim();
    let user = req.session.loginUser._id;
    let description = req.body.description;
    let content = req.body.content;
    let image = req.session.img;
    Content.create({category:category,title:title,user:user,description:description,content:content,images:image}).then(function (err) {
        delete req.session.img;
        res.render("success",{msg:{success:'内容保存成功过!!!!!'}});
    }).then(() =>{
        newName2=null
    });
});
/*跳转到文章管理页面*/
router.get("/admin",checklogin,function (req,res) {
    //每页显示的条数
    let limit = 12;
    //页数
    let page = Number(req.query.page || 1);
    //过滤数目
    let skip = (page-1)*limit;
    //总页数初始化
    let pages = 0;
    //count
    //查询所有的博文
    Content.count().then(function (count) {
        //页数
        pages = Math.ceil(count/limit);
        //最大page
        page = Math.min(page,pages-1);
        //设置最小
        page = Math.max(page,1);
        Content.find().limit(limit).skip(skip).populate(['category', 'user']).then(function (contents) {
            let arr =[];
            for(let i=0;i<contents.length;i++){
                let nowT = contents[i].addTime;
                let now = moment(nowT).format("YYYY-MM-DD HH:mm:ss");
                arr.push(now);
            }
            res.render("admin",{
                contents:contents,
                count:count,
                pages:pages,
                page:page,
                arr:arr
            })
        })
    })
});
//-----------------------------------------------------（node-admin-sys）新后台mongodb数据CRUD操作-----------------------------------------------------------------
//超级管理员-登录后台首页显示的页面
router.get('/index_v3',checklogin,function (req,res,next) { 
    Content.count().then(function (count1) {
        res.count1 = count1;
        next();
    })
 });
 router.get('/index_v3',checklogin,function (req,res,next) { 
    User.count().then(function (count2) {
        res.count2 = count2;
        next();
    })
});
router.get("/index_v3",checklogin,function (req,res) {
    // 查询评论表最新消息
    let limit = 10;
    Comment.find().limit(limit).populate(['userID','contentID']).then(function (comments) { 
        let arr =[];
        for(let i=0;i<comments.length;i++){
            let nowT = comments[i].addTime;
            let now = moment(nowT).format("YYYY-MM-DD HH:mm:ss");
            arr.push(now);
        }
         res.render("node-admin-sys-index_v3",
         {
            comments:comments,
            count1:res.count1,
            count2:res.count2,
            arr:arr
         }
         );
     })
});

//跳转到部门文件文档管理中心
router.get("/fileController",checklogin,function (req,res) {
    Content.find({}).sort({_id:-1}).populate(['category','user']).then(function (contents) {
        let arr =[];
        for(let i=0;i<contents.length;i++){
            let nowT = contents[i].addTime;
            let now = moment(nowT).format("YYYY-MM-DD HH:mm:ss");
            arr.push(now);
        }
        //循环遍历获取contents数据结构中的contents内容并用正则的匹配方式将a标签塞到一个数据结构中。
        //arrContents数组包含内容中的所有a标签的href中的链接
        var arrContents = [];
        for (let j = 0; j<contents.length; j++) {
            //获取子文档中的contents的String内容
            let childContent = contents[j].contents;
            let childArr = [];
            // console.log(contents[2].contents)
            //正则获取所有的a标签
            let reg = /<a[^>]+?href=["']?([^"']+)["']?[^>]*>([^<]+)<\/a>/gi;
            while(reg.exec(childContent)){
                childArr.push(RegExp.$1);
            }
            //这是输出整个 <a></a>标签
            // let found = childContent.match(reg);
            //拼接found数组存入到arrContents数组中.
            arrContents = arrContents.concat(childArr);
        }

        //获取所有a标签的文字.保存在arrContentTexts数组中
        var arrContentTexts = [];
        for (let i = 0;i<contents.length;i++){
            //获取子文档中的contents的String内容
            let childContent = contents[i].contents;
            let childArr = [];
            //正则获取a标签中的文字
            let reg = /<a[^>]*>((?:(?!<\/a>)[\s\S])*)<\/a>/gi;
            while(reg.exec(childContent)){
                childArr.push(RegExp.$1);
            }
            //拼接found数组存入到arrContents数组中.
            arrContentTexts = arrContentTexts.concat(childArr);
        }

        // console.log(arrContentTexts);

        res.render("node-admin-filecontroller",{
            contents:contents,
            categorys:res.categorys,
            arr:arr,
            arrContents:arrContents,//文件内容的超链接
            arrContentTexts:arrContentTexts,//文件内容a的text内容
            //热帖子
            contentHost:res.contentsHost
        });
    });

});

//用户列表查询显示
router.get("/userList",checklogin,function (req,res) {
    //每页显示条数
    let  limit = 19;
    //页数
    let page = Number(req.query.page || 1);
    //过滤条数
    let skip = (page -1 ) *limit;
    //总页数初始值
    let pages = 0;
    let userType = '';
    User.count().then(function (count) {
        //总页数
        pages = Math.ceil(count/limit);
        //最大页数
        page = Math.min(page,pages-1);
        //最小页数
        page = Math.max(page,1);
        userType = 'user';
        //查询所有用户数据User.find({isBigadmin:{$ne:true},live:{$ne:false}})
        //相对应结构化SQL而言 "$ne"=>"!="
        User.find({isBigadmin:{$ne:true},live:{$ne:false}}).skip(skip).limit(limit).then(function(users){
            let arr = [];
            for(let i=0;i<users.length;i++){
                let addT = users[i].addTime;
                let now = moment(addT).format("YYYY-MM-DD HH:mm:ss");
                arr.push(now);
            }
            res.render("node-admin-sys-userList",{users:users,
                count:count,
                pages :pages,
                page:page,
                userType:userType,
                arr:arr
            });
        });
    });
});
//查询admin 管理员
router.get("/adminList",checklogin,function (req,res) {
    //每页显示条数
    let limit = 15;
    //页数
    let page = Number(req.query.page || 1);
    //过滤条数
    let skip = (page -1) * limit;
    //总页数初始值
    let pages = 0;
    //用户类型
    let userType = '';
    User.count().then(function (count) {
        //用户类型
        userType = 'admin';
        //总页数
        pages = Math.ceil(count/limit);
        // console.log(count);
        //最大页数
        page = Math.min(page,pages-1);
        //最小页数
        page = Math.max(page,1);
        //相对应结构化SQL而言 "$ne"===================>"!="
        User.find({isBigadmin:{$ne:false},live:{$ne:false}}).skip(skip).limit(limit).then(function(users){
            let arr = [];
            for(let i = 0;i<users.length;i++){
                let addT = users[i].addTime;
                let now = moment(addT).format("YYYY-MM-DD HH:mm:ss");
                arr.push(now);
            }
            res.render("node-admin-sys-userList",{users:users,
                count:count,
                pages :pages,
                page:page,
                userType:userType,
                arr:arr
            });
        });
    });
});
//用户删除
router.get("/delete_user",checklogin,function (req,res) {
    //根据id 修改live 变为伪删除
    let id = req.query.id;
    User.update({_id:id},{$set:{live:false}},function (err) {
        //重定向到用户列表页
        if (!err){
            //没出现出error 重定向
            res.redirect("/admin/userList");
        }
    })
});
//查询分类上跳转到容文章发布页面 + 查询所属分类
router.get("/contentEdit",checklogin,function (req,res) {
    //查询所有类目跳转完成并显示
    Category.find({live:{$ne:false}},function (err,categorys) {
        res.render("node-admin-sys-markdown",{categorys:categorys});
    });
});
//添加内容
router.post("/addContent",checklogin,function (req,res) {
    //标题
    let title  = req.body.title.trim();
    //所属类目
    let category = req.body.category;
    //用户ID 从session 中获取
    let userID = req.session.loginUser._id;
    //简介
    let description = req.body.description;
    //内容
    let content = req.body.content;
    //获取session 当中的img数组
    var images = req.session.img;
    //数据库操作 数据保存成功
    Content.create({category:category,title:title,user:userID,description:description,contents:content,images:images}).then(function (err) {
        // if (err){
        //     //错误时候
        //     return  res.redirect('/admin/contentEdit');
        // }else{
            //成功跳转
            Category.find({live:{$ne:false}},function (err,categorys) {
                //删除session当中的img图片数组
                res.render("node-admin-sys-markdown",{categorys:categorys,msg:{success:'ok'}});
            });
        // }
    });
    //删除session当中的img数组
    delete req.session.img;
});
//全部博文测试展示demo
router.get("/blog",checklogin,function (req,res) {
    Content.find({}).sort({_id:-1}).populate(['category','user']).then(function (contents) {
        //空数组 存储过滤处理好的时间数据
        let arr =[];
        //遍历内容中的 博文时间过滤处理
        for(let i=0;i<contents.length;i++){
            let nowT = contents[i].addTime;
            let now = moment(nowT).format("YYYY-MM-DD HH:mm:ss");
            arr.push(now);
        }
        let comments = contents.length;
        //阅读数目
        let views= contents.views;
        res.render("node-admin-sys-blog",{contents:contents,comments:comments,views:views,arr:arr})
    });

    //mongodb sort : -1是降序排序
    });
//博文全部列表
router.get("/contentList",checklogin,function (req,res) {
    //每页显示的条数
    let limit = 6;
    //页数
    let page = Number(req.query.page || 1);
    //过滤数目
    let skip = (page-1)*limit;
    //总页数初始化
    let pages = 0;
    //count
    //查询所有的博文
    Content.count().then(function (count){
        //页数
        pages = Math.ceil(count/limit);
        //最大page
        page = Math.min(page,pages-1);
        //设置最小
        page = Math.max(page,1);
        Content.find().limit(limit).skip(skip).populate(['category', 'user']).then(function (contents) {
            let arr =[];
            for(let i=0;i<contents.length;i++){
                let nowT = contents[i].addTime;
                let now = moment(nowT).format("YYYY-MM-DD HH:mm:ss");
                arr.push(now);
            }
            res.render("node-admin-sys-contentList",{
                contents:contents,
                count:count,
                pages:pages,
                page:page,
                arr:arr
            })
        })
    })
});
//删除帖子
router.get("/delete_content",checklogin,function (req,res) {
    //根据ID 真删除文章
    let id = req.query.id;
    //根据ID删除对应的mongodb文档
    Content.remove({_id:id},function (err) {
        if (!err){
            //没出错的情况下 重定向到contentList列表
            res.redirect("/admin/contentList")
        }
    })
});
//全部栏目查询展示s
router.get("/categoryList",checklogin,function (req,res) {
    //每页显示的条数
    let limit = 6;
    //页数
    let page = Number(req.query.page || 1);
    //过滤数目
    let skip = (page-1)*limit;
    //总页数初始化
    let pages = 0;
    //count
    Category.count().then(function (count) {
        //页数
        pages = Math.ceil(count/limit);
        //最大page
        page = Math.min(page,pages);
        //设置最小
        page = Math.max(page,1);
        Category.find({live:true}).skip(skip).limit(limit).then(function (categorys) {
            res.render("node-admin-sys-categoryList",{
                categorys:categorys,
                count:count,
                pages:pages,
                page:page
            });
        });
    });
});
//跳转到添加栏目表单
router.get("/categoryForm",checklogin,function (req,res) {
    res.render("node-admin-sys-addCategory");
});
//添加栏目表单提交
router.post('/add_Category',checklogin,function (req,res) {
    //分类名 输入不能为空，判断栏目名是否存在
    //获取用户填写的栏目名称
    let categoryName = req.body.name.trim();
    //栏目简介
    let description  = req.body.description.trim();
    //分类是否为空
    if(categoryName === ''){
        //返回错误提示
        res.render("node-admin-sys-addCategory",{msg:{err:'err'}});
    }
    //查找mongodb中是否有该栏目
    Category.findOne({name:categoryName},function (err,categorys) {
        if(categorys){
            //栏目存在的情况
            res.render("node-admin-sys-addCategory",{msg:{err:'err'}});
        }else{
            //栏目不存在的情况 向mongodb数据库插入新增栏目数据
            Category.create({name:categoryName,description:description},function (err) {
                if(!err) {
                    //插入成功返回显示
                    res.render("node-admin-sys-addCategory", {msg: {success: 'ok'}})
                }else {
                    //返回错误提示
                    console.log("插入错误！！！");
                }
            });
        }
    });
});
//评论管理 查询所有评论
router.get('/commentList',checklogin,function (req,res) {
   //查询所有用户的评论列表展示
    Comment.find({}).populate(['userID','contentID']).then(function (comments) {
        let arr =[];
        for(let i=0;i<comments.length;i++) {
            let nowT = comments[i].addTime;
            let now = moment(nowT).format("YYYY-MM-DD HH:mm:ss");
            arr.push(now);
        }
        res.render('node-admin-sys-comment',{
            //遍历所有的contents双层遍历
            comments:comments,
            arr:arr
        })
    });
});
//评论删除 正常不不脑残的评论是不删除该内容的评论的
router.get("/commentsDelete",checklogin,function (req,res) {
    //获取评论ID
    let id = req.query.id;
    //根据ID评论列表
        //跟新操作
        Comment.update({_id:id},{$set:{live:false}},function (err) {
            //重定向到评论页面
            if(!err) {
                res.redirect("/admin/commentList");
            }
        })
});
module.exports = router;


