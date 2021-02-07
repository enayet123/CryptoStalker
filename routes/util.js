var constants = require('./constants');
var request = require('request');
var cache = require('memory-cache');

const getSubscriptions = (coins) => 
  Object.keys(coins)
  .map(k => coins[k])
  .map(e => `0~${e.exchange}~${e.name}~${e.pair}`)
  //.flatMap(e => [`${e}${constants.GBP}`, `${e}${constants.USD}`]);

const getConversion = async () => 
  request({ uri: 'https://api.exchangeratesapi.io/latest?base=USD' }, (_, __, body) => 
    cache.put('USD_GBP', JSON.parse(body).rates.GBP)
  );

const getPrecision = (price) => {
  if (price > 10000) return 2;
  if (price > 1000) return 3;
  if (price > 100) return 4;
  if (price > 10) return 5;
  return 6;
}

const asUSD = (price) => `$${price.toFixed(getPrecision(price))}`;

const asGBP = (price) => `£${(price * cache.get('USD_GBP')).toFixed(getPrecision(price))}`;

const options = (body) => ({
  uri: process.env.SLACK_HOOK_URL_GENERAL,
  body: JSON.stringify({ text: body }),
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

const sendToSlack = (str) => request(options(str), (error, response) => {
  console.log(`[MSGSTART]\n${str}\n[MSGEND]`);
  if (error) console.log('[ERROR] ' + error,response.body);
  return;
});

module.exports = {
  getSubscriptions,
  getConversion,
  asUSD,
  asGBP,
  sendToSlack
};