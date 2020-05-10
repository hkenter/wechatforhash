const { Wechaty } = require('wechaty');
const { PuppetPadplus } = require ('wechaty-puppet-padplus');
let iniParser = require('iniparser');
let config = iniParser.parseSync('resource/config.ini');

const token = config['SECRET']['token'];
const puppet = new PuppetPadplus({
    token,
});
const name  = 'bot-data-for-hash';
const bot = new Wechaty({
    puppet,
    name, // generate xxxx.memory-card.json and save login data for the next login
});

// process.env.BROLOG_LEVEL = 'silly';

bot
    .on('login',   `./listener/on-login`)
    .on('scan', `./listener/on-scan`)
    .on('message', `./listener/on-message`)
    .on('logout',  `./listener/on-logout`)
    .start()
    .then(v => {
        // console.log(v);
    })
    .catch(e => console.error('捕捉error\r\n' + e));

module.exports = bot;