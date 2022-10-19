const request = require('request');
const puppeteer = require('puppeteer');

console.log("Scraping the organ database...");
let browser;
(async () => {
  browser = await puppeteer.launch();
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
      return result.attributes['href'].value;
    })
  }, ".row.grid a[href^='/organ']");
  

  console.log("RESULTS:");
  console.log(links.join("\n"));

  // TODO: Pagination

  const namesOfAllOrgans = (await Promise.allSettled(
    links.map(async (link, index) => {
      console.log(`Opening page for ${link}`);
      const page = await browser.newPage();
      await page.goto(`https://pipeorgandatabase.org${link}`, {waitUntil: "domcontentloaded"});
      const organTitle = await page.evaluate(sel => {
        return document.querySelector(sel).textContent;
      }, ".organ-title.text-dark").trim();

      await page.close();
      console.log(`Got title ${organTitle}`);
      return organTitle;
    })
  ));

  console.log(namesOfAllOrgans);

  

})()
  .catch(err => console.error(err))
  .finally(() => browser.close());