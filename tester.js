const express = require('express');
const swig = require('swig');

app=express();
//设置渲染文件的目录
app.set('views','./');
//设置html模板渲染引擎
app.engine('html',swig.renderFile);
//设置渲染引擎为html
app.set('view engine','html');

app.listen(9527);

//调用路由，进行页面渲染
app.get('/',function(request,response){
    //调用渲染模板
    response.render('tester',{
        //传参
        // title:'首页', content:'Render template'
    });

});