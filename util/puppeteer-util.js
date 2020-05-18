const puppeteer = require('puppeteer');

async function getViewScreenshot(func, ticker) {
    const browser = await puppeteer.launch({
        // slowMo: 100,    //放慢速度
        headless: true,
        // defaultViewport: {width: 1440, height: 780},
        ignoreHTTPSErrors: false, //忽略 https 报错
        args: ['--no-sandbox'] // linux root 必填
    });
    const page = await browser.newPage();
    // await page.goto('http://' + 'localhost:9527' + '/' + func + `?ticker=${ticker}`);
    await page.goto(`https://s.tradingview.com/mediumwidgetembed/?symbols=SSE%3A${ticker}%7C1d&locale=zh_CN&trendLineColor=%232196F3&underLineColor=%23E3F2FD&fontColor=%23787B86&gridLineColor=%23F0F3FA&width=1000px&height=calc(400px%20-%2032px)&colorTheme=light&utm_source=localhost&utm_medium=widget_new&utm_campaign=symbol-overview`);
    await page.waitFor('.symbol-last');

    await page.screenshot({path: `./files/pic/${func}_${ticker}.png`});
    await browser.close();
}

module.exports = {
    getViewScreenshot
};

// getViewScreenshot('overview', '600208 ');