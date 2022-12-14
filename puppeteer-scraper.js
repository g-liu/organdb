const puppeteer = require('puppeteer');
const config = require('./config.json');
const fs = require('fs');
const { performSearch } = require('./organ-search.js');
const { getOrgan } = require('./organscraper.js');

console.log("Scraping the organ database...");
let browser;
(async () => {
  browser = await puppeteer.launch({headless: !config.debug, defaultViewport: null});
  var page = await performSearch(browser);
  
  // try {
  //   await page.waitForNetworkIdle({idleTime: 500, timeout: 30000}); // NOT WORKING?
  // } catch (e) {
  //   console.error("Wait failed");
  //   console.error(e);

  //   page.screenshot({path: './searchpage.png', fullPage: true, captureBeyondViewport: true});
  // }

  var links = await getResultsFromPage(page);

  var maxPages = (config.pages < 0 ? Infinity : config.pages);

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
    var urlString = await page.evaluate(el => el.attributes["href"].value, pageNumberAnchor);

    const restOfPages = [...Array(Math.min(lastPage-firstPage, maxPages)).keys()].map(x => {
      var pageNumber = x + firstPage + 1;
      var url = new URL(`https://pipeorgandatabase.org${urlString}`);
      url.searchParams.set("page", pageNumber);
      return url.toString();
    });

    console.log("Will add the following pages to explore:");
    console.log(restOfPages.join("\n"));

    // LMAO THIS MAY NOT BE SAFE, mutating `links` in a promise scope
    (await Promise.allSettled(
      restOfPages.map(async (link, index) => {
        console.log(`Opening results page ${index+2}`);
        const page = await browser.newPage();
        await page.goto(link);

        const additionalLinks = await getResultsFromPage(page);
        links = links.concat(additionalLinks);

        await page.close();

        return Promise.resolve();
      })
    ));
  }

  console.log("All the organs:");
  console.log(links.join("\n"));

  const organs = await Promise.allSettled(
    links.map(async (link, index) => {
      var organId = link.split("/").at(-1);
      return await getOrgan(browser, organId);
    })
  ).catch(e => console.error(e));

  console.log(`Found organ data for ${organs.length} organ(s)`);

  const fileName = './webpages/locationdata.json';
  var fileContents = JSON.stringify(organs.map(promise => promise.value), null, 2);
  try {
    fs.writeFileSync(fileName, fileContents);
    console.log(`Wrote ${fileContents.length} bytes to ${fileName}`);
  } catch (err) {
    console.error(`Error writing to ${fileName}`);
    console.error(err);
  }

})()
  .catch(err => console.error(err))
  .finally(() => browser.close());


async function getResultsFromPage(page) {
  await page.waitForSelector("#dropdownMenuButton", {timeout: 0});
  console.log(`Results loaded for ${page.url()}`);

  const expectedResults = await page.waitForSelector(".page-title .text-secondary").textContent;
  console.log(`Expecting ${expectedResults}`);

  // TODO: Y THIS NO WORK
  // const alertDiv = page.$("div[role='alert']");
  // if (alertDiv != null) {
  //   console.error("Uh oh... page says:");
  //   console.error(alertDiv.textContent);
  //   // TODO: Abort?
  // }

  // extract results

  // WHY DOES PAGE.$$ NEVER WORK!!!!!!!!!!!!!!!!!!!!!
  var expectedOnPage = await page.$$(".row.grid a[href^='/organ']").length;
  console.log(`Expecting ${expectedOnPage} results on page.`);

  const links = await page.evaluate(resultsSelector => {
    return [...document.querySelectorAll(resultsSelector)].map(result => {
      return result.attributes['href'].value;
    })
  }, ".row.grid a[href^='/organ']");

  console.log(`Processed ${links.length} results on page.`);

  return links;
}