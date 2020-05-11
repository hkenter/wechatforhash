let str = '{ BTC: { USD: 8648.61, CNY: 63054.1 } }';

let json_btc_price = JSON.stringify(eval('(' + str + ')'));
json_btc_price = JSON.parse(json_btc_price);
console.log(json_btc_price['BTC']);