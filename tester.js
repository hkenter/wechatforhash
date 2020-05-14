const DelayQueueExecutor = require('rx-queue').DelayQueueExecutor;


const delay = new DelayQueueExecutor(500);  // set delay period time to 500 milliseconds
// delay.subscribe(console.log);

delay.execute(() => console.log(1))
delay.execute(() => console.log(2))
delay.execute(() => console.log(3))
