const { getOrgan } = require('../organscraper.js');
const puppeteer = require('puppeteer');

let browser;

(async () => {
  browser = await puppeteer.launch();
  var info = await getOrgan(browser, 66913);

  console.log(JSON.stringify(info));
})()
  .finally(() => browser.close());