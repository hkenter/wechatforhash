let bot = require('./../demo');
let RestUtil = require('./../util/rest-util');

let busyIndicator    = false
let busyAnnouncement = `Automatic Reply: I can't read your message because I'm offline now. I'll reply you when I come back.`

// Message
async function onMessage(msg) {
    const filehelper = bot.Contact.load('filehelper');

    if (msg.type() !== bot.Message.Type.Text
        && msg.type() !== bot.Message.Type.Emoticon
        && msg.type() !== bot.Message.Type.Image
        && msg.type() !== bot.Message.Type.Location
        && msg.type() !== bot.Message.Type.Recalled) {
        return
    }
    let content = msg.text();
    const contact = msg.from();
    const receiver = msg.to();
    const room = msg.room();
    let say_someting = null;
    let contact_for_say = null;

    if (receiver !== null && receiver.id === 'filehelper') {
        if (content === '#status') {
            await filehelper.say('in busy mode: ' + busyIndicator);
            await filehelper.say('auto reply: ' + busyAnnouncement);
        } else if (content === '#free') {
            busyIndicator = false;
            await filehelper.say('auto reply stopped.');
        } else if (content === '#busy') {
            busyIndicator = true;
            await filehelper.say('in busy mode: ' + 'ON');
            await filehelper.say('auto reply message: "' + busyAnnouncement + '"');
        }
        return
    }

    if (!busyIndicator) {
        // free

        // 撤回处理
        if (room === null) {
            console.log(msg.type() + ': '+ content);
        } else {
            let topic = await room.topic();
            console.log(msg.type() + ': '+ topic + '^^^^^^' + content);
        }
        if (msg.type() === bot.Message.Type.Recalled) {
            console.log('RecalledEvent!');
            const recalledMessage = await msg.toRecalled();
            say_someting = '撤回事件激活：\r\n' + recalledMessage;
            let me = await bot.Contact.find({name:'王某人'});
            if (room === null) {
                me.say(say_someting);
            } else {
                // room.sync();
                // let room = bot.Room.load('xxxx@chatroom');
                // let topic = await room.topic();
                // room.say(say_someting);
                console.log('recalled for me');
                me.say(say_someting);
            }
            console.log(`Message: ${recalledMessage} has been recalled.`)
            return
        }
        if (await msg.mentionSelf()) {
            if (content.indexOf('btc') >= 0 && content.indexOf('所有人') < 0) {
                // get btc price
                let json_btc_price = await RestUtil.getResponseBTC();
                await msg.say(`BTC当前报价:\r\nUSD:${json_btc_price['BTC']['USD']}\r\nCNY:${json_btc_price['BTC']['CNY']}`, contact);
                return
            }
            return
        }
        if (content === 'wechaty') {
            say_someting = 'welcome to wechaty!';
            await contact.say(say_someting);
            return
        }
        if (content.indexOf('BTC合约交易机会出现') >= 0) {
            let limit_position = null;
            let stop_profit_position = null;
            let stop_loss_position = null;
            // get okex-btc-usd-swap index
            let json_btc_usd_swap_index = await RestUtil.get_BTC_USD_SWAP_INDEX_OKEX();
            console.log(`okex永续BTC指数：${json_btc_usd_swap_index['index']}`);
            content = content.split('\n\n');
            content.forEach(function (line) {
                if (line.indexOf('挂单点位') >= 0) {
                    limit_position = line.split('：')[1];
                    if (limit_position.indexOf('到市价')) {
                        limit_position = limit_position.slice(0, limit_position.indexOf('到'));
                    }
                }
                if (line.indexOf('止盈点位') >= 0) {
                    stop_profit_position = line.split('：')[1];
                }
                if (line.indexOf('止损点位') >= 0) {
                    stop_loss_position = line.split('：')[1];
                }
            });
            if (json_btc_usd_swap_index['index'] - limit_position >= 50) {
                console.log('此单可做');
                let json_btc_usd_swap_position = await RestUtil.get_BTC_USD_SWAP_POSITION_OKEX();
                console.log(json_btc_usd_swap_position);
            } else {
                console.log('此单不可做');
            }

            console.log(`挂单点位：${limit_position}`);
            console.log(`止盈点位：${stop_profit_position}`);
            console.log(`止损点位：${stop_loss_position}`);
            return
        }
        return
    }
    if (await msg.mentionSelf()) {
        console.log('this message were mentioned me! [You were mentioned] tip ([有人@我]的提示)');
        const contactList = await msg.mentionList();
        const contactIdList = contactList.map(c => c.id);
        if (contactIdList.includes(this.userSelf().id)) {
            await msg.say(busyAnnouncement, contact);
        }
    } else if(room === null) {
        await msg.say(busyAnnouncement);
        return
    }

    if (room === null) {
        contact_for_say = contact;
    } else {
        contact_for_say = room;
        console.log((room.id));
    }

}

module.exports = onMessage;
