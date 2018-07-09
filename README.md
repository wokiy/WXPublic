# WXPublic
> 企业微信公总号开发过程记录

### 申请公众号
- 登录地址 ： https://mp.weixin.qq.com/，注册-选择类型
- 公众号，服务号类型查看  账号类型区别 ：http://kf.qq.com/faq/170815aUZjeQ170815mU7bI7.html
- 公众号申请流程 ： http://kf.qq.com/product/weixinmp.html#hid=99

### 开发准备

- 创建web项目（node.js） 搭建开发环境
- 公众号账号登录后，会看到一个首页界面，请熟悉界面左侧菜单：
- 在“功能”菜单下面，不需要自己开发，可以实现的基本功能，编辑完成可以查看公众号，实现简单的公众号。
- 在“设置”菜单下，公众号设置可以查看“设置详情”，点击“功能设置”，有一个“网页授权域名”这个设置的是你web项目发布后的域名。
- 微信认证流程：http://kf.qq.com/product/weixinmp.html#hid=97
- “开发”菜单下的“基本配置”可以看到“公众号开发信息”需要先设置secret和ip白名单，这三个信息在“开发者工具”下的“开发者文档”获取access_token时会用到。
- 请熟悉“开发者文档”！https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1445241432

### 开发者文档

##### 获取access_token
- 在创建好的web项目中，新建WxController.java,wx.js根据文档 (https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140183) 获取
- 通过OkHttp做get请求，请求 https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
- 公众号账号登录—基本配置—公众号开发信息，可以获取到appid和secret两个参数；
- 如果与文档正确返回结果一致，即获取成功

##### 自定义菜单创建接口

- 仔细阅读文档 https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141013
- Token获取后，根据自定义菜单请求格式创建菜单，将token以及菜单作为参数通过okhttp的post请求创建菜单，若与文档正确结果一致则成功
  ，此时打开微信公众号，可以看到手机上出现菜单（注：只有修改创建菜单的代码才需要对创建菜单做post请求）；
  
##### 微信网页开发

- 仔细阅读文档 https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140842
- 了解Scope的snsapi_base和snsapi_userinfo区别；
- 了解网页授权access_token和普通access_token的区别；

```
  第一步获取code：

    访问链接URL：

    https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPE&state=STATE#wechat_redirect 

    用户同意后，跳转redirect_uri/?code=CODE&state=STATE；

    其中redirect_uri：

    public static String AppDomain = "www.baodu.com";（网页授权域名）

    String back_url = "http://" + AppDomain + "/wx/back/openid";

    String redirect_uri = URLEncoder.encode(back_url, "utf-8");

    （授权后重定向的回调链接地址，请使用urlEncode对链接进行处理）

    所以，只需要配好URL的参数，然后 return "redirect:" + url; 就会自动跳转到redirect_uri/?code=code&state=state;（注：链接里的code就是要作为，获取access_token的参数的）

    将code作为参数请求下面链接：

    https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code 

    若请求成功，就获取网页access_token和"openid":"OPENID"；

    如果scope为snsapi_base流程到这里就结束了；

    如果想拿用户信息，需要将scope改为 snsapi_userinfo，才可以接着通过okhttp的get请求访问

    https://api.weixin.qq.com/sns/userinfo?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN ；

    如果正确最终返回json格式的用户信息，你可以将json解析传给对象，对用户信息进行入库操作等。
```










