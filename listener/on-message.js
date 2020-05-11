let bot = require('./../demo');

let busyIndicator    = false
let busyAnnouncement = `Automatic Reply: I can't read your message because I'm offline now. I'll reply you when I come back.`

// Message
async function onMessage(msg) {
    const filehelper = bot.Contact.load('filehelper');

    if (msg.type() !== bot.Message.Type.Text
        && msg.type() !== bot.Message.Type.Emoticon
        && msg.type() !== bot.Message.Type.Image
        && msg.type() !== bot.Message.Type.Location
        && msg.type() !== bot.Message.Type.Recalled
        && msg.type() !== bot.Message.Type.MiniProgram) {
        return
    }
    const content = msg.text();
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
            // to be continued
            return
        }
        if (content === 'wechaty') {
            say_someting = 'welcome to wechaty!';
            await contact.say(say_someting);
            return
        } else if (content.indexOf('活动推送查询') >= 0) { // 活动推送查询 + event_id
            console.log('活动查询event！');
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
