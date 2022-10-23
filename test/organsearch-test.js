const { performSearch } = require('../organ-search.js');
const puppeteer = require('puppeteer');

let browser;
(async () => {
  browser = await puppeteer.launch();
  console.log("Starting test...");
  var page = await performSearch(browser);

  await page.waitForSelector("div.card-body"); // Legit? IDK!
  await page.screenshot({path: `searchresultspage.png`, fullPage: true, captureBeyondViewport: true});

  console.log("Search is completed. See screenshots");
  page.close();
})()
  .catch(e => console.error(e))
  .finally(() => browser.close());