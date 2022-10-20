/**
 * Gets data regarding a single organ in the pipe organ DB
 * E.g. https://pipeorgandatabase.org/organ/6551
 */

const puppeteer = require('puppeteer');


/**
 * Scrapes and returns information of a single organ
 * @param {id} id a numeric id for the organ
 */
const getOrgan = async (browser, id) => {
  console.log(`Opening page for organ #${id}`);
  const page = await browser.newPage();
  const pageUrl = `https://pipeorgandatabase.org/organ/${id}`;
  await page.goto(pageUrl, {waitUntil: "networkidle0", timeout: 0});
  console.log(`Loaded page for #${id}`);

  const organTitle = await getOrganTitle(page);
  const latlon = await getLatLong(page);
  const location = await getLocation(page);
  const conditionNotes = await getConditionNotes(page);
  const lastUpdate = await getLastUpdate(page);
  const stoplistLink = await getStoplistLink(page);
  
  return {
    ...organTitle,
    ...latlon,
    ...location,
    ...conditionNotes,
    ...lastUpdate,
    ...stoplistLink,
    pageUrl
  };
}

async function getOrganTitle(page) {
  const titleElement = await page.waitForSelector(".organ-title");
  const organTitle = await page.evaluate(el => el.textContent.trim(), titleElement);

  const subtitleElement = await page.$(".organ-subtitle");
  const subtitleText = await page.evaluate(el => el != null ? el.textContent.trim() : undefined, subtitleElement);

  return {title: organTitle, subtitle: subtitleText};
}

/**
 * Get latitude longitude
 * @param {*} page browser page
 * @returns { lat, lon } where both lat and lon are Floats
 */
async function getLatLong(page) {
  try {
    var locationHtml = await page.evaluate(sel => document.querySelector(sel).innerHTML, ".card-text");
  } catch(err) {
    console.error(`AYO HOLD UP COULDN'T FIND THE CARD TEXT? ${err}`);
    return { lat: 0, lon: 0 };
  }

  const locationText = await page.evaluate(sel => document.querySelector(sel).textContent, ".card-text");
  var latLongMatches = locationHtml.match(/(\-?\d+\.\d+),\s+(\-?\d+\.\d+)/);
  if (latLongMatches.length > 0) {
    const lat = +latLongMatches[1]; const lon = +latLongMatches[2];
    return {lat: lat, lon: lon};
  } else {
    console.log(`No location info found for ${link}`);
    return {lat: 0, lon: 0};
  }
}

/**
 * Get location
 * @param {*} page browser page
 * @returns {location} where location is a string
 */
async function getLocation(page) {
  var locationText = await page.evaluate(sel => document.querySelector(sel).textContent, ".card-text");
  locationText = locationText.split("\n").map(text => text.trim()).filter(text => text.length > 0).join("\n");
  return {location: locationText};
}

async function getConditionNotes(page) {
  var conditionHeader = await page.$x("//h4[contains(text(), 'Condition')]");
  if (conditionHeader.length == 0) { return null; }

  conditionList = await page.evaluate(el => {
    const lists = el.parentElement.querySelectorAll("ul li");
    return Array.from(lists).map(li => li.textContent.trim());
  }, conditionHeader[0]);

  return {conditionNotes: conditionList};
}

async function getLastUpdate(page) {
  var conditionHeader = await page.$x("//h4[contains(text(), 'Condition')]");
  if (conditionHeader.length == 0) { return null; }

  var lastUpdate = await page.evaluate(el => {
    const updateTexts = el.parentElement.querySelectorAll("small");
    if (updateTexts.length == 0) { return null; }

    return updateTexts[0].textContent.split("\n").at(-1).trim();
  }, conditionHeader[0]);

  return {lastUpdate};
}

async function getStoplistLink(page) {
  var stoplistAnchor = await page.$("#accordion-stoplists a[href^='/stoplist']");
  if (stoplistAnchor == null) { return null; }

  var href = await page.evaluate(el => el.attributes["href"].value, stoplistAnchor);
  return {stoplistLink: `https://pipeorgandatabase.org${href}`};
}

module.exports = { getOrgan };