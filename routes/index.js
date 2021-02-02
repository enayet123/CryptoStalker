var express = require('express');
var router = express.Router();
var cron = require('node-cron');
var request = require('request');
var cache = require('memory-cache');

const GBP = 'gbp';
const USD = 'usd';

const options = (txt) => ({
  uri: 'https://hooks.slack.com/services/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',
  body: JSON.stringify({text: txt}),
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})

const sendToSlack = (str) => request(options(str), (error, response) => {
  console.log(`[INFO] Sending to slack: ${str}`);
  if (error) console.log('Error: ' + error,response.body);
  return;
});

const put = (gbp, usd) => {
  console.log(`[INFO] Putting: { gbp: ${gbp}, usd: ${usd} }`)
  cache.put(GBP, gbp);
  cache.put(USD, usd);
}

const cacheCheck = (gbp, usd) => {
  if (!(cache.get(GBP) && cache.get(USD))) {
    console.log(`[INFO] Cache was empty`);
    put(gbp, usd);
    sendToSlack(`£${gbp} | $${usd}`);
    return;
  }
  const data = { gbp: cache.get(GBP), usd: cache.get(USD) };
  console.log(`[INFO] Old cache: { gbp: ${data.gbp}, usd: ${data.usd} }`);
  console.log(`[INFO] Differece between old and new GBP price: ${Math.abs(data.gbp - gbp)}`);
  if (Math.abs(data.gbp - gbp) >= 2.5) {
    put(gbp, usd);
    sendToSlack(`£${gbp} | $${usd}`);
  }
};

router.get('/', async (req, res) => {
  request.get('https://www.bitstamp.net/api/v2/ticker/xrpusd/', (_, res, usd) => {
    request.get('https://www.bitstamp.net/api/v2/ticker/xrpgbp/', (_, resp, gbp) => 
      cacheCheck(JSON.parse(gbp).last, JSON.parse(usd).last))
  });
  return null;
});

cron.schedule('*/5 * * * *', () => 
  request.get('https://www.bitstamp.net/api/v2/ticker/xrpusd/', (_, res, usd) => 
    request.get('https://www.bitstamp.net/api/v2/ticker/xrpgbp/', (_, resp, gbp) =>
      cacheCheck(JSON.parse(gbp).last, JSON.parse(usd).last)))
);

module.exports = router;
