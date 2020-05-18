let bot = require('./../demo');
const DelayQueueExecutor = require('rx-queue').DelayQueueExecutor;
const PuppeteerUtil = require('./../util/puppeteer-util');
const { FileBox } = require('file-box');
const DBUtil = require('./../util/db-util');
const RestUtil = require('./../util/rest-util');
const EnumUtil = require('./../util/enum-util');

const delay = new DelayQueueExecutor(5 * 1000);
delay.subscribe(console.log);
let busyIndicator    = false;
let busyAnnouncement = `Automatic Reply: I can't read your message because I'm offline now. I'll reply you when I come back.`;
let worker_map = new Map();

async function init() {
    let rows = await DBUtil.execSql('select supported_algorithm_names,group_concat(model) as worker_chain from WORK_INFO group by supported_algorithm_names', null);
    let worker_split = [];
    for (let row of rows[0]) {
        let worker_chain = await row['worker_chain'].split(',');
        await Array.prototype.push.apply(worker_split, worker_chain);
    }

    for (let i=0;i < worker_split.length;i++) {
        for (let row of rows[0]) {
            if (row['worker_chain'].indexOf(worker_split[i]) >= 0) {
                if (worker_split[i].indexOf('/') > 0) {
                    worker_split[i] = await worker_split[i].split('/')[0].replace(/\s/ig,''); // 去除字符串内所有的空格
                } else {
                    worker_split[i] = await worker_split[i].replace(/\s/ig,'');
                }
                await worker_map.set(worker_split[i].toLocaleUpperCase(), parseArray(row['supported_algorithm_names'])[0]);
            }
        }
    }
    console.log(worker_map);
}

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
                await me.say(say_someting);
            } else {
                // room.sync();
                // let room = bot.Room.load('xxxx@chatroom');
                // let topic = await room.topic();
                // room.say(say_someting);
                console.log('recalled for me');
                await me.say(say_someting);
            }
            console.log(`Message: ${recalledMessage} has been recalled.`);
            return
        }
        if (await msg.mentionSelf()) {
            return
        }
        // BTC实时报价
        if (content.toLocaleUpperCase() === ('BTC') && content.indexOf('所有人') < 0) {
            // get btc price
            let json_btc_price = await RestUtil.getResponseBTC();
            await delay.execute(() => msg.say(`BTC当前报价:\r\nUSD:${json_btc_price['BTC']['USD']}\r\nCNY:${json_btc_price['BTC']['CNY']}`, contact));
            return
        }
        // 交易查询
        if (content.length === 64) {
            let tx_info = await RestUtil.getResponseTX(encodeURI(content));
            if (tx_info['err_no'] === 0) {
                await delay.execute(() => msg.say(`交易金额：${tx_info['data']['outputs_value']/100000000} BTC\r\n区块高度：${tx_info['data']['block_height']}\r\n确认数：${tx_info['data']['confirmations']}`));
            }
            return
        }
        // 矿机查询
        if (worker_map.has(content.replace(/\s/ig,'').toLocaleUpperCase())) {
            let worker_name_cleaned = await content.replace(/\s/ig,'').toLocaleUpperCase();
            console.log('has true! ' + worker_name_cleaned);
            let rows = await DBUtil.execSql('SELECT model,power,brand,brand_en,compute_powers FROM WORK_INFO WHERE model = ?', [content.toLocaleUpperCase()]);
            if (rows[0].length === 0) {
                rows = await DBUtil.execSql('SELECT model,power,brand,brand_en,compute_powers FROM WORK_INFO WHERE replace(model,\' \',\'\') LIKE ?', [content.toLocaleUpperCase() + '%']);
            }
            let worker_info = '';
            rows[0].forEach(function (row) {
                let compute_powers_obj = JSON.parse(row['compute_powers']);
                worker_info += row['brand'] + row['model'] + '\r\n功耗：' + row['power'] + 'W   '
                    + compute_powers_obj[worker_map.get(worker_name_cleaned)]['compute_power'] + ' ' + compute_powers_obj[worker_map.get(worker_name_cleaned)]['unit']
                    + '\r\n功耗比：' + Math.round(row['power']/(compute_powers_obj[worker_map.get(worker_name_cleaned)]['compute_power_num']/1000000000000)) + 'W/T\r\n\r\n'
            });
            await delay.execute(() => msg.say(worker_info, contact));
            console.log(rows);
            return
        }
        // 股票overview
        if (content.length === 6 &&
            (content.startsWith('600') || content.startsWith('601') || content.startsWith('603'))) {
            console.log('into overview: ' + content);
            await PuppeteerUtil.getViewScreenshot('overview', content);
            let pic_file = FileBox.fromFile(`./files/pic/overview_${content}.png`);
            await msg.say(pic_file, contact);
            return
        }
        // 自定义下单
        if (content.indexOf('BTC合约交易机会出现') >= 0) {
            let limit_position = null;
            let stop_profit_position = null;
            let stop_loss_position = null;
            let side = null;
            let type = null;
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
                if (line.indexOf('做多') >= 0) {
                    side = 'long';
                    type = EnumUtil.type.OPEN_LONG;
                } else if (line.indexOf('做空') >= 0) {
                    side = 'short';
                    type = EnumUtil.type.OPEN_SHORT;
                }
            });
            if (json_btc_usd_swap_index['index'] - limit_position >= 50) {
                console.log('此单可做');
                let json_btc_usd_swap_position = await RestUtil.get_BTC_USD_SWAP_POSITION_OKEX();
                for (const holding of json_btc_usd_swap_position['holding']) {
                    if (holding['side'] === side && holding['position'] === '0') {
                        let json_btc_usd_swap_order = await RestUtil.set_SWAP_ORDER_OKEX(
                            20, EnumUtil.order_type.Market, type, null, EnumUtil.instrument_id.BTC_USD_SWAP);
                        await msg.say(`${side} 本单已开\r\n单号：${json_btc_usd_swap_order['order_id']}`, contact);
                    }
                }
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
            await delay.execute(() => delay.execute(() => msg.say(busyAnnouncement, contact)));
        }
    } else if(room === null) {
        await delay.execute(() => delay.execute(() => msg.say(busyAnnouncement)));
        return
    }

    if (room === null) {
        contact_for_say = contact;
    } else {
        contact_for_say = room;
        console.log((room.id));
    }

}

init().then(r => null);

module.exports = onMessage;

/***
 * convert string to Array object
 * right input:var jsonStr='[1,2, 3,"whuang"]';
 * wrong input:var jsonStr='[1,2, 3,whuang]';
 * @param arrStr
 */
function parseArray(arrStr) {
    console.log(arrStr);
    let tempKey = 'arr23' + new Date().getTime(); //arr231432350056527
    let arrayJsonStr = '{"' + tempKey + '":' + arrStr + '}';
    let arrayJson;
    if (JSON && JSON.parse) {
        arrayJson = JSON.parse(arrayJsonStr);
    } else {
        arrayJson = eval('(' + arrayJsonStr + ')');
    }
    return arrayJson[tempKey];
}
