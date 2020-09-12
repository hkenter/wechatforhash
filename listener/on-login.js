let bot = require('./../demo');
const RestUtil = require('./../util/rest-util');
const schedule = require('node-schedule');
const DelayQueueExecutor = require('rx-queue').DelayQueueExecutor;
const delay = new DelayQueueExecutor(5 * 1000);
const translate = require('google-translate-api');

// 登录
async function onLogin (user) {
    require('./../util/server-util');
    console.log(`${user}登录了`);

    //每分钟的第8秒定时执行一次:
    const dt_room = await bot.Room.find({topic: '数字部落★提升群'}); //嘎嘎嘎\数字部落★提升群
    let json_basic_news = await RestUtil.getNews();
    await schedule.scheduleJob('8 * * * * *',async ()=>{
        await console.log('scheduleCronstyle:' + new Date());
        let json_news = await RestUtil.getNews();

        let titles = new Map();
        for(let json_new of json_news['results']) {
            titles.set(json_new['title'], true);
        }
        console.log(titles);
        for(let json_basic_new of json_basic_news['results']) {
            for (let [key, value] of titles) {
                if (json_basic_new['title'] == key) {
                    titles.set(key, false);
                }
            }
        }
        console.log(titles);
        for (let [key, value] of titles) {
            if (value) {
                translate(key, {to: 'zh-CN'}).then(res => {
                    console.log(res.text);
                    delay.execute(() => dt_room.say(res.text));
                }).catch(err => {
                    console.error(err);
                });
            }
        }
        json_basic_news = json_news;
    });
}

module.exports = onLogin;