let bot = require('./../demo');
const RestUtil = require('./../util/rest-util');
const schedule = require('node-schedule');
const DelayQueueExecutor = require('rx-queue').DelayQueueExecutor;
const delay = new DelayQueueExecutor(5 * 1000);

// 登录
async function onLogin (user) {
    require('./../util/server-util');
    console.log(`${user}登录了`);

    //每分钟的第8秒定时执行一次:
    const dt_room = await bot.Room.find({topic: '数字部落★提升群'});
    let json_basic_news = await RestUtil.getNews();
    await schedule.scheduleJob('8 * * * * *',async ()=>{
        await console.log('scheduleCronstyle:' + new Date());
        let json_news = await RestUtil.getNews();

        for(let json_new of json_news['results']) {
            console.log(json_new);
            for(let json_basic_new of json_basic_news['results']) {
                if (json_new['title'] !== json_basic_new['title']) {
                    await delay.execute(() => dt_room.say(json_new['title']));
                }
            }
        }
        json_basic_news = json_news;
    });
}

module.exports = onLogin;