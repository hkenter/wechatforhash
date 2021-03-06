let bot = require('./../demo');
const { UrlLink } = require('wechaty');
const DelayQueueExecutor = require('rx-queue').DelayQueueExecutor;
const Json2csvParser = require('json2csv').Parser;
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
            console.log(msg.type() + `: ${contact.name()}: ${content}`);
        } else {
            let topic = await room.topic();
            console.log(msg.type() + `: ${topic}: ${contact.name()}: ${content}`);
        }
        if (msg.type() === bot.Message.Type.Recalled) {
            const recalledMessage = await msg.toRecalled();
            say_someting = '撤回事件激活：\r\n' + recalledMessage;
            console.log(contact.id);
            let me = await bot.Contact.load('xihuanzuoaime');
            if (room === null) {
                await delay.execute(() => me.say(say_someting));
            } else {
                // room.sync();
                // let room = bot.Room.load('xxxx@chatroom');
                // let topic = await room.topic();
                // room.say(say_someting);
                await delay.execute(() => me.say(say_someting));
            }
            console.log(`Message: ${recalledMessage} has been recalled.`);
            return
        }
        if (await msg.mentionSelf()) {
            return
        }
        if(room !== null && content.startsWith('随机抽取') && (content.length === 6)) {
            let members = ['Li', 'Tian', 'Sun', 'Chen', 'Liu',
                'Sun', 'Pan', 'Zhang', 'Lao', 'Hao'];
            getRandomArrayElements(members, content.slice(4, 5)).forEach(function f(value, index) {
                delay.execute(() => msg.say(`随机抽取人No.${index + 1}：${value}`, contact));
            });
        }
        // AI机器人模式
        if((content.startsWith('~') || content.startsWith('～')) && content.length > 1) {
            content = content.substr(1);
            let reply_obj = await RestUtil.getResponseRobot(content, contact.id);
            if (reply_obj['code'] === 0 && reply_obj['msg'] === 'ok') {
                let service = reply_obj['result']['intents'][0]['parameters']['service'];
                if (service === 'music') {
                    let response = reply_obj['result']['intents'][0]['result']['response'];
                    if (response['code'] === 0 && response['msg'] === '成功') {
                        let music_info = response['result']['music_list'][0];
                        if (music_info['music163'].length > 0) {
                            const link = new UrlLink({
                                description : `一首${music_info['name']}送给你，Dear ${contact.name()}`,
                                title       : music_info['name'],
                                url         : `https://y.music.163.com/m/song?id=${music_info['music163']}&from=message`,
                                thumbnailUrl: music_info['image'],
                            });
                            await delay.execute(() => msg.say(link, contact));
                        } else {
                            return
                        }
                    }
                } else if (service === 'chat_common') {
                    await delay.execute(() => msg.say(reply_obj['result']['intents'][0]['result']['text'], contact));
                } else if (service === 'calculator') {
                    await delay.execute(() => msg.say(reply_obj['result']['intents'][0]['result']['text'], contact));
                }
            }
            return
        }
        let token_infos_map = global.token_infos_map;
        console.log(token_infos_map);
        if (token_infos_map.has(content.toLocaleLowerCase())) {
            let token_info = token_infos_map.get(content.toLocaleLowerCase());
            await delay.execute(() => msg.say(`${content.toLocaleLowerCase()}最新报价: $${token_info['latest_price']}\r\n24小时涨跌: ${Number(token_info['price_24h_change']*100).toFixed(2)}%\r\n24小时年化收益: ${Number(token_info['revenue_24h_change']*100).toFixed(2)}%\r\n7天年化收益: ${Number(token_info['revenue_7d_change'] * 100).toFixed(2)}%\r\n30天年化收益: ${Number(token_info['revenue_30d_change'] * 100).toFixed(2)}%`, contact));
        }
        /**
         * token top 1000
         */
        if (content === 'top1000' && (contact.name() === '凌海' || contact.id === 'miuyan0153' || contact.id === 'rujiang53242671' || contact.id === 'xihuanzuoaime')) {
            let json_top_1000 = await RestUtil.getTopTokens_1000_cmc();
            let fields = ['id', 'name', 'symbol', 'slug', 'num_market_pairs', 'date_added', 'tags', 'max_supply', 'circulating_supply', 'total_supply', 'platform'
                , 'cmc_rank', 'last_updated', 'quote'];
            let json2csvParser = new Json2csvParser({ fields });
            let csv = await json2csvParser.parse(json_top_1000['data']);
            let fs = require('fs');
            fs.writeFile("./files/top1000.csv", csv, function(err) {
                if(err) {return console.log(err);}
                console.log("The file was saved!");
            });
            let top1000_fileBox = FileBox.fromFile('./files/top1000.csv')
            await delay.execute(() => msg.say(top1000_fileBox, contact));
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
                    + '\r\n功耗比：' + (row['power']/(compute_powers_obj[worker_map.get(worker_name_cleaned)]['compute_power_num']/1000000000000)).toFixed(1) + 'W/T\r\n\r\n'
            });
            await delay.execute(() => msg.say(worker_info, contact));
            console.log(rows);
            return
        }
        // 股票overview
        if (content.length === 6 &&
            (content.startsWith('600') || content.startsWith('601')
                || content.startsWith('603') || content.startsWith('688'))) {
            console.log('into overview: ' + content);
            await PuppeteerUtil.getOverviewScreenshot(content);
            let pic_file = FileBox.fromFile(`./files/pic/Overview_${content}.png`);
            await delay.execute(() => msg.say(pic_file, contact));
            await PuppeteerUtil.getTechAnalysisScreenshot(content);
            pic_file = FileBox.fromFile(`./files/pic/TechAnalysis_${content}.png`);
            await delay.execute(() => msg.say(pic_file, contact));
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

function getRandomArrayElements(arr, count) {
    let shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}
