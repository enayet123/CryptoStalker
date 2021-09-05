var request = require('request');
var cache = require('memory-cache');

const getSubscriptions = (coins) => 
  Object.keys(coins)
  .map(k => coins[k])
  .map(asSubscription)

const asSubscription = (coin) => 
  `0~${coin.exchange}~${coin.name}~${coin.pair}`

const getConversion = async () => 
  request({ uri: process.env.EXCHANGE_HTTPS + process.env.EXCHANGE_KEY + process.env.EXCHANGE_PARAMS }, (_, __, body) => 
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

const getStats = (cache24Data, cacheData, storeData) => {
  const percentage24Change = ((cache24Data.USD - storeData.USD) / cache24Data.USD);
  const percentageChange = ((cacheData.USD - storeData.USD) / cacheData.USD);
  const priceChangeAbs = Math.abs(cacheData.USD - storeData.USD).toFixed(3);
  const priceChangeAbsTrunc = new String(priceChangeAbs).substring(0,5);
  const arrow24Emoji = ((percentage24Change > 0) ? ':down' : ':up') + 'arrow:';
  const arrowEmoji = ((percentageChange > 0) ? ':down' : ':up') + 'arrow:';
  const dailyMovement = Math.abs(percentage24Change * 100).toFixed(3);
  const delta = `${priceChangeAbsTrunc}`;
  return { delta, dailyMovement, arrowEmoji, arrow24Emoji };
}

module.exports = {
  getSubscriptions,
  asSubscription,
  getConversion,
  asUSD,
  asGBP,
  sendToSlack,
  getStats,
};