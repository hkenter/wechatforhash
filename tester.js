const DelayQueueExecutor = require('rx-queue').DelayQueueExecutor;


const delay = new DelayQueueExecutor(500);  // set delay period time to 500 milliseconds
// delay.subscribe(console.log);

delay.execute(() => console.log(1))
delay.execute(() => console.log(2))
delay.execute(() => console.log(3))
//
// console.log(parseArray('["Ealgesong"]'));
//
// function parseArray(arrStr) {
//     let tempKey = 'arr23' + new Date().getTime(); //arr231432350056527
//     let arrayJsonStr = '{"' + tempKey + '":' + arrStr + '}';
//     let arrayJson;
//     if (JSON && JSON.parse) {
//         arrayJson = JSON.parse(arrayJsonStr);
//     } else {
//         arrayJson = eval('(' + arrayJsonStr + ')');
//     }
//     return arrayJson[tempKey];
// }