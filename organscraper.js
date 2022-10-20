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
  await page.goto(`https://pipeorgandatabase.org/organ/${id}`, {waitUntil: "networkidle0", timeout: 600000 /* 10 min */});
  console.log(`Loaded page for #${id}`);

  const organTitle = await getOrganTitle(page);
  const latlon = await getLatLong(page);
  const location = await getLocation(page);

  // Coordinates are in a comment node
  // try {
  //   var locationHtml = await page.evaluate(sel => document.querySelector(sel).innerHTML, ".card-text");
  // } catch(err) {
  //   console.error(`AYO HOLD UP COULDN'T FIND THE CARD TEXT? ${err}`);
  //   return { lat: 0, lon: 0, name: organTitle, location: null };
  // }

  // const locationText = await page.evaluate(sel => document.querySelector(sel).textContent, ".card-text");
  // var latLongMatches = locationHtml.match(/(\-?\d+\.\d+),\s+(\-?\d+\.\d+)/);
  // if (latLongMatches.length > 0) {
  //   console.log(`Found location at ${latLongMatches[0]}`);
  //   await page.close();

  //   const lat = +latLongMatches[1]; const lon = +latLongMatches[2];
  //   return {lat: lat, lon: lon, name: organTitle, location: locationText};
  // } else {
  //   console.log(`No location info found for ${link}`);
  //   await page.close();

  //   return {lat: 0, lon: 0, name: organTitle, locationText: locationText};
  // }

  return {
    ...organTitle,
    ...latlon,
    ...location
  };
}

async function getOrganTitle(page) {
  var titleElement = await page.waitForSelector(".organ-title");
  const organTitle = await page.evaluate(el => el.textContent.trim(), titleElement);

  var subtitleElement = await page.waitForSelector(".organ-subtitle");
  var subtitleText = await page.evaluate(el => el.textContent.trim(), subtitleElement);

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
    console.log(`Found location at ${latLongMatches[0]}`);

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
  const locationText = await page.evaluate(sel => document.querySelector(sel).textContent, ".card-text");
  return {location: locationText};
}

module.exports = { getOrgan };