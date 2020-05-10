let bot = require('./../demo');

// 登录
async function onLogin (user) {
    console.log(`${user}登录了`);
}

module.exports = onLogin;