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

  const [firstPage, lastPage] = await page.evaluate(resultsSelector => {
    const pageNumbers = [...document.querySelectorAll(resultsSelector)].map(e => {
      return +e.textContent;
    }).sort((a,b) => {a<b});

    return [pageNumbers.at(0), pageNumbers.at(-1)];
  }, ".page-number");

  if (firstPage < lastPage) {
    // then there are multiple pages of results... let's take care of that.
    console.log(`Found ${lastPage} pages of results`);

    // prepare page urls from firstPage+1...lastPage
    await page.waitForSelector("a.page-number")
    
    var pageNumberAnchor = await page.$("a.page-number");
    var urlString = await page.evaluate(el => el.href, pageNumberAnchor);

    const restOfPages = [...Array(lastPage-firstPage).keys()].map(x => {
      var pageNumber = x + firstPage + 1;
      var url = new URL(`https://pipeorgandatabase.org${urlString}`);
      url.searchParams.set("page", pageNumber);
      return url.toString();
    });

    console.log("Will add the following pages to explore:");
    console.log(restOfPages.join("\n"));
  }

  // TODO: Pagination

  const namesOfAllOrgans = (await Promise.allSettled(
    links.map(async (link, index) => {
      console.log(`Opening page for ${link}`);
      const page = await browser.newPage();
      await page.goto(`https://pipeorgandatabase.org${link}`, {waitUntil: "domcontentloaded"});
      console.log(`Loaded page for ${link}`);
      var titleElement = page.waitForSelector(".organ-title.text-dark");
      const organTitle = await page.evaluate(el => el.textContent.trim(), titleElement);

      await page.close();

      console.log(`Got title ${organTitle}`);
      return organTitle;
    })
  ));

  console.log(JSON.stringify(namesOfAllOrgans));

  

})()
  .catch(err => console.error(err))
  .finally(() => browser.close());