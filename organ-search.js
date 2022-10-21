const puppeteer = require('puppeteer');
const config = require('./config.json');
const fs = require('fs');

const performSearch = async (browser) => {
  const page = await browser.newPage();

  if (config.searchtype == "quick") {
    await page.goto("https://pipeorgandatabase.org/organs/search/quick");
  } else if (config.searchtype == "power") {
    await page.goto("https://pipeorgandatabase.org/organs/search/power");
  } else {
    console.error(`${config.searchtype} is not a valid search type in config!`);
    return;
  }

  console.log(`Navigated to ${config.searchtype} search page.`);

  if (config.builder) {
    await page.type("#builder", config.builder);
  }

  if (config.city) {
    await page.type("#city", config.city);
  }

  if (config.zip) {
    await page.type("#zipcode", `${config.zip}`);
  }

  if (config.zipMaxRadius) {
    await page.type("#zipRadius", `${config.zipMaxRadius}`);
  }

  console.log("Finished entering data");

  // TODO: Other options

  await page.waitForSelector("button[type='submit']");
  await page.click("button[type='submit']");

  return page;
};

module.exports = { performSearch };