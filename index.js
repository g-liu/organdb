var fs = require('fs');
var _ = require('lodash');
var cheerio = require('cheerio');
var http = require('http');
var request = require('request');

console.log("Scraping the organ database...");
request("https://pipeorgandatabase.org/organs/search/quick", function(err, res, body) {
  // need #csrf_token value
  if (err || res.statusCode != 200) {
    console.log("an error was encountered");
    console.log(err);
    return;
  }
  console.log("data received for search page");

  var $ = cheerio.load(body);

  var csrf = $("#csrf_token").val();
  console.log(`Got csrf token ${csrf}`);

  request(`https://pipeorgandatabase.org/organs/search/quick?csrf_token=${csrf}&city=seattle`, function(err, res, body) {
    if (err || res.statusCode != 200) {
      console.log("Welp couldn't load results :(");
      console.log(err);
      return;
    }
    console.log("data received for results page");

    var $ = cheerio.load(body);

    var allResultsOnPage = $("a[href^='/organ'] > .card");
    var numResults = allResultsOnPage.length;

    console.log(`Got ${numResults} results :)`);
    var resultText = allResultsOnPage.text();

    console.log(resultText);
  });

});