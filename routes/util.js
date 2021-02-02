var constants = require('./constants');
var request = require('request');
var cache = require('memory-cache');

const options = (body, coin) => ({
  uri: constants.SLACK_HOOK_URL[coin],
  body: JSON.stringify({text: body}),
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

const sendToSlack = (str, coin) => request(options(str, coin), (error, response) => {
  console.log(`[MSG] ${str}`);
  if (error) console.log('[ERROR] ' + error,response.body);
  return;
});

const put = (gbp, usd, coin) => {
  console.log(`[INFO] Putting: { gbp: ${gbp}, usd: ${usd} }`);
  cache.put(coin + constants.GBP, gbp);
  cache.put(coin + constants.USD, usd);
}

const get = (coin) => {
  const gbp = cache.get(coin + constants.GBP);
  const usd = cache.get(coin + constants.USD);
  console.log(`[INFO] Getting: { gbp: ${gbp}, usd: ${usd} }`);
  return { gbp, usd };
}

const priceCheck = (gbp, usd, coin) => {
  if (!(cache.get(coin + constants.GBP) && cache.get(coin + constants.USD))) {
    console.log(`[INFO] Cache was empty`);
    put(gbp, usd, coin);
    sendToSlack(`£${gbp} | $${usd}`, coin);
    return;
  }

  const data = get(coin);
  console.log(`[INFO] Differece between old and new GBP price: ${Math.abs(data.gbp - gbp)}`);
  if (Math.abs(data.gbp - gbp) >= constants.MARGIN[coin]) {
    put(gbp, usd, coin);
    sendToSlack(`£${gbp} | $${usd}`, coin);
  }
};

module.exports = {
  priceCheck
};