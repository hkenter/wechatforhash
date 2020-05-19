const puppeteer = require('puppeteer');

async function getOverviewScreenshot(ticker) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    // await page.goto('http://' + 'localhost:9527' + '/' + func + `?ticker=${ticker}`);
    await page.goto(`https://s.tradingview.com/mediumwidgetembed/?symbols=SSE%3A${ticker}%7C1d&locale=zh_CN&trendLineColor=%232196F3&underLineColor=%23E3F2FD&fontColor=%23787B86&gridLineColor=%23F0F3FA&width=1000px&height=calc(400px%20-%2032px)&colorTheme=light&utm_source=localhost&utm_medium=widget_new&utm_campaign=symbol-overview`);
    await page.waitForSelector('.option-39ZFf678', { timeout: 300000 });
    await sleep(3000);

    await page.screenshot({path: `./files/pic/Overview_${ticker}.png`});
    await browser.close();
}

async function getTechAnalysisScreenshot(ticker) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    // await page.goto('http://' + 'localhost:9527' + '/' + func + `?ticker=${ticker}`);
    await page.goto(`https://s.tradingview.com/embed-widget/technical-analysis/?locale=zh_CN#%7B%22interval%22%3A%221W%22%2C%22width%22%3A425%2C%22isTransparent%22%3Afalse%2C%22height%22%3A450%2C%22symbol%22%3A%22SSE%3A${ticker}%22%2C%22showIntervalTabs%22%3Atrue%2C%22colorTheme%22%3A%22dark%22%2C%22utm_source%22%3A%22cn.tradingview.com%22%2C%22utm_medium%22%3A%22widget_new%22%2C%22utm_campaign%22%3A%22technical-analysis%22%7D`);
    await page.waitForSelector('.arrowMain-4Z6WqtKf', { timeout: 300000 });
    await sleep(1000);

    await page.screenshot({path: `./files/pic/TechAnalysis_${ticker}.png`});
    await browser.close();
}

function getBrowser() {
    return puppeteer.launch({
        // slowMo: 100,    //放慢速度
        headless: false,
        // defaultViewport: {width: 1440, height: 780},
        ignoreHTTPSErrors: false, //忽略 https 报错
        args: ['--no-sandbox', '--lang=zh_CN.UTF-8', '--disable-gpu'] // linux root 必填
    });
}

//延时函数
function sleep(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(1)
            } catch (e) {
                reject(0)
            }
        }, delay)
    })
}

module.exports = {
    getOverviewScreenshot,
    getTechAnalysisScreenshot
};

// getOverviewScreenshot('overview', '600208 ');