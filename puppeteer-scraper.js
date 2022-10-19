const request = require('request');
const puppeteer = require('puppeteer');

console.log("Scraping the organ database...");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://pipeorgandatabase.org/organs/search/quick");
  console.log("Opened the search page.");
  // request("https://pipeorgandatabase.org/organs/search/quick", function(err, res, body) {

  // });

  await page.type("#city", "Seattle"); // TODO: Dynamic option
  await page.waitForSelector("button[type=submit]");
  await page.click("button[type=submit]");

  console.log("Clicked search")

  // wait for results...

  await page.waitForSelector("#dropdownMenuButton");
  console.log("Results loaded.");

  // extract results

  const links = await page.evaluate(resultsSelector => {
    return [...document.querySelectorAll(resultsSelector)].map(result => {
      return result.textContent;
    })
  }, "a[href^='/organ'] > .card");

  console.log("RESULTS:");
  console.log(links.join("\n"));

  await browser.close();
})();