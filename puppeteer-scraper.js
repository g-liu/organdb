const request = require('request');
const puppeteer = require('puppeteer');
const config = require('./config.json');

console.log("Scraping the organ database...");
let browser;
(async () => {
  browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://pipeorgandatabase.org/organs/search/quick");
  console.log("Opened the search page.");
  // request("https://pipeorgandatabase.org/organs/search/quick", function(err, res, body) {

  // });

  await page.type("#city", config.city);
  await page.waitForSelector("button[type=submit]");
  await page.click("button[type=submit]");

  console.log("Clicked search");

  // wait for results...

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
        console.log(`Opening results page ${index}`);
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

  // TODO: FURTHER PROCESSING
  // return;

  const locations = await Promise.allSettled(
    links.map(async (link, index) => {
      console.log(`Opening page for ${link}`);
      const page = await browser.newPage();
      await page.goto(`https://pipeorgandatabase.org${link}`, {waitUntil: "networkidle0", timeout: 300000 /* 5 min */});
      console.log(`Loaded page for ${link}`);

      // Example: Getting title
      // var titleElement = await page.waitForSelector(".organ-title");
      // const organTitle = await page.evaluate(el => el.textContent.trim(), titleElement);

      // Coordinates are in a comment node
      try {
        var locationText = await page.evaluate(sel => document.querySelector(sel).innerHTML, ".card-text");
      } catch(err) {
        console.error(`AYO HOLD UP COULDN'T FIND THE CARD TEXT? ${err}`);
      }

      var latLongMatches = locationText.match(/\-?\d+\.\d+,\s+\-?\d+\.\d+/);
      if (latLongMatches.length > 0) {
        console.log(`Found location at ${latLongMatches[0]}`);
        await page.close();
        return latLongMatches[0];
      } else {
        console.log(`No location info found for ${link}`);
        await page.close();
        return await page.evaluate(sel => document.querySelector(sel).textContent, ".card-text");
      }
    })
  ).catch(e => console.error(e));

  console.log(JSON.stringify(locations.map(loc => loc.value)));

  

})()
  .catch(err => console.error(err))
  .finally(() => browser.close());



async function getResultsFromPage(page) {
  await page.waitForSelector("#dropdownMenuButton");
  console.log(`Results loaded for ${page.url()}`);

  // extract results

  const links = await page.evaluate(resultsSelector => {
    return [...document.querySelectorAll(resultsSelector)].map(result => {
      return result.attributes['href'].value;
    })
  }, ".row.grid a[href^='/organ']");

  return links;
}