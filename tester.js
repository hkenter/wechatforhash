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

let members = ['Li Ming', 'Tian laoshi', 'Sun Yi', 'Yu Xinjia', 'Jiang Wen', 'Chen Dong', 'Liu Luyang',
    'Sun Yanjie', 'Pan Hang', 'Zhang Yunlong', 'Lao Qin', 'Hao Lv'];
console.log(getRandomArrayElements(members, 2));
console.log('随机抽取2人'.length);