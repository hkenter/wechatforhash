const axios = require('axios-https-proxy-fix');
const CryptoJS = require("crypto-js");
const Crypto = require("crypto");
const EnumUtil = require('./../util/enum-util');
let iniParser = require('iniparser');
let config = iniParser.parseSync('./resource/config.ini');

let proxy = {
    host: config['PROXY']['ip'],
    port: config['PROXY']['port']
};
axios.defaults.timeout = 10000; //超时取消请求

async function getOkexHeadersToken(method, api_url, body='') {
    /*
        {
        "iso": "2015-01-07T23:47:25.201Z",
        "epoch": 1420674445.201
        }
    * */
    if (body !== '') {
        body = JSON.stringify(body);
    }
    let timestamp = await get_TIMESTAMP_OKEX();
    let what = timestamp['epoch'] + method + api_url + body;
    let hmac = Crypto.createHmac('sha256', config['OKEX']['SECRET-KEY']);
    let signature = hmac.update(what).digest('base64');
    // signature = CryptoJS.enc.Base64.stringify(
    //     CryptoJS.HmacSHA256(timestamp['epoch'] + method + api_url + body, config['OKEX']['SECRET-KEY']));

    return {
        'Content-Type': 'application/json; charset=utf-8',
        'OK-ACCESS-KEY': config['OKEX']['OK-ACCESS-KEY'],
        'OK-ACCESS-PASSPHRASE': config['OKEX']['OK-ACCESS-PASSPHRASE'],
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp['epoch']
    };
}

async function getResponseBTC() {
    let url = "https://min-api.cryptocompare.com/data/pricemulti";
    let params= {
        fsyms: 'BTC',
        tsyms: 'USD,CNY'
    };
    let headers = null;
    return await getResponseDefault(url, headers, params, proxy);
}

async function get_TIMESTAMP_OKEX() {
    let url = config['OKEX']['api_url'] + config['OKEX']['get_timestamp'];
    let headers = null;
    let param = null;
    return await getResponseDefault(url, headers, param, proxy);
}

async function get_BTC_USD_SWAP_INDEX_OKEX() {
    let url = config['OKEX']['api_url'] + config['OKEX']['get_index'];
    let headers = await getOkexHeadersToken('GET', config['OKEX']['get_index']);
    let param = null;
    return await getResponseDefault(url, headers, param, proxy);
}

async function get_BTC_USD_SWAP_POSITION_OKEX() {
    let url = config['OKEX']['api_url'] + config['OKEX']['get_position'];
    let headers = await getOkexHeadersToken('GET', config['OKEX']['get_position']);
    let param = null;
    return getResponseDefault(url, headers, param, proxy);
}

async function set_SWAP_ORDER_OKEX(size, order_type, type, price, instrument_id) {
    let url = config['OKEX']['api_url'] + config['OKEX']['set_swap_order'];
    let param = {
        "size": size,
        "order_type": order_type,
        "type": type,
        "price": price,
        "instrument_id": instrument_id
    };
    let headers = await getOkexHeadersToken('POST', config['OKEX']['set_swap_order'], param);
    return postResponseDefault(url, headers, param, proxy);
}

async function getResponseDefault(url, headers, param, proxy) {
    return new Promise((resolve, reject) => {
        axios.get(url, {
            params: param,
            headers: headers,
            // httpAgent: new HttpProxyAgent("http://" + ip + ":" + port),
            // httpsAgent: new HttpProxyAgent("http://" + ip + ":" + port)
            proxy: proxy
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

async function postResponseDefault(url, headers, param, proxy) {
    console.log(proxy);
    return new Promise((resolve, reject) => {
        axios({
            method: "post",
            url: url,
            data: param,
            headers: headers,
            proxy: proxy
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
        // axios.post(url, {
        //     params: param,
        //     headers: headers,
        //     // httpAgent: new HttpProxyAgent("http://" + ip + ":" + port),
        //     // httpsAgent: new HttpProxyAgent("http://" + ip + ":" + port)
        //     proxy: proxy
        // })
        //     .then(function (response) {
        //         console.log(response.data);
        //         resolve(response.data);
        //     })
        //     .catch(function (error) {
        //         console.log(error);
        //         reject(error);
        //     })
        //     .then(function () {
        //         // always executed
        //     });
    });
}

module.exports = {
    getResponseBTC,
    get_BTC_USD_SWAP_INDEX_OKEX,
    get_BTC_USD_SWAP_POSITION_OKEX,
    set_SWAP_ORDER_OKEX,
    getResponseDefault,
    postResponseDefault
};
