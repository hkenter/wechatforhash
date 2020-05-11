const axios = require('axios-https-proxy-fix');
// const HttpProxyAgent = require('http-proxy-agent');
let iniParser = require('iniparser');
let config = iniParser.parseSync('./resource/config.ini');

let ip=config['PROXY']['ip'];
let port=['PROXY']['port'];
axios.defaults.timeout = 10000; //超时取消请求

async function getResponseBTC() {
    return new Promise((resolve, reject) => {
        axios.get("https://min-api.cryptocompare.com/data/pricemulti", {
            params: {
                fsyms: 'BTC',
                tsyms: 'USD,CNY'
            },
            proxy: {
                host: ip,
                port: port
            }
        })
            .then(function (response) {
                console.log(response.data);
                resolve(response.data);
            })
            .catch(function (error) {
                console.log(error);
                reject(error);
            })
            .then(function () {
                // always executed
            });
    });
}

async function getResponseDefault(url, param) {
    axios.get(url, {
        params: param,
        // httpAgent: new HttpProxyAgent("http://" + ip + ":" + port),
        // httpsAgent: new HttpProxyAgent("http://" + ip + ":" + port)
        proxy: {
            host: ip,
            port: port
        }
    })
        .then(function (response) {
            console.log(response.data);
            return response.data;
        })
        .catch(function (error) {
            console.log(error);
        })
        .then(function () {
            // always executed
        });
}

module.exports = {
    getResponseBTC,
    getResponseDefault
};