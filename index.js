var fs = require('fs');
var _ = require('lodash');
var cheerio = require('cheerio');
var http = require('http');
var request = require('request');

console.log("Scraping the organ database...");
request("https://pipeorgandatabase.org/organs/search/quick", function(err, res, body) {
  // need #csrf_token value
  if (err || res.statusCode != 200) {
    console.error("an error was encountered");
    console.error(err);
    return;
  }
  console.log("data received for search page");

  var $ = cheerio.load(body);

  var csrf = $("#csrf_token").val();
  console.log(`Got csrf token ${csrf}`);

  // TODO: MAKE CONFIGURABLE
  var city = "Seattle";

  request(`https://pipeorgandatabase.org/organs/search/quick?csrf_token=${csrf}&institution=&city=${city}&builder=&opus=&year=&state=&country=`, function(err, res, body) {
    if (err || res.statusCode != 200) {
      console.error("Welp couldn't load results :(");
      console.error(err);
      return;
    }

    var $ = cheerio.load(body);

    if ($("#city").length > 0) {
      // Fuck, we're still on the search page
      console.error("Fuck, CSRF failed.");
      return;
    }

    if ($(".row").text().indexOf("There are no results") != -1) {
      // Fuck, no results
      console.log("No results :(");
      return;
    }

    console.log("data received for results page");

    var allResultsOnPage = $("a[href^='/organ'] > .card");
    var numResults = allResultsOnPage.length;

    console.log(`Got ${numResults} results :)`);
    var resultText = allResultsOnPage.text();

    // todo: handle pagination

    console.log(resultText);
  });

});