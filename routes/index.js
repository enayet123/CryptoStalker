const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const util = require('./util');
const constants = require('./constants');
const cache = require('memory-cache');
const createStream = require('./cryptocompare');
const env = require('dotenv');

env.config();

// Obj used to store current prices, acting as a sort of dictionary
const store = {};

const coins = JSON.parse(process.env.COINS);
const subs = util.getSubscriptions(coins);
const stream = createStream(subs);

util.getConversion();

stream.on(constants.STREAM_MESSAGE, function incoming(data) {
  const msg = JSON.parse(data);
  if (msg.TYPE === constants.MSG_TYPE) {
    console.log(`[PRICE] ${msg.M} \t${msg.FSYM}: ${msg.P} ${msg.TSYM}`);
    if (!(`${msg.FSYM}` in store)) {
      store[`${msg.FSYM}`] = {}
    }
    store[`${msg.FSYM}`][constants.USD] = msg.P;
    cache.put(constants.STORE, JSON.stringify(store));
  }
});

const update24 = () => {
  const stored = { ...store };

  for (const coinName in stored) {
    cache.put(`${coinName}24`, JSON.stringify(stored[coinName]));
  }
}

const update = (forced, res) => {
  let changes = [];
  const cached = JSON.parse(cache.get(constants.STORE));

  for (const coinName in cached) {
    const storeData = { ...store }[coinName];
    const cacheData = JSON.parse(cache.get(coinName));
    const cache24Data = JSON.parse(cache.get(`${coinName}24`));
    
    if (cache24Data && cacheData) {
      const margin = coins[coinName].margin;
      const difference = Math.abs(storeData.USD - cacheData.USD);
      
      if (difference > margin || forced) {
        const emoji = coins[coinName].emoji;
        const percentageChange = ((cache24Data.USD - storeData.USD) / cache24Data.USD);
        const dailyMovement = Math.abs(percentageChange).toFixed(3);
        const arrowEmoji = ((percentageChange > 0) ? ':up' : ':down') + 'arrow:';
        cache.put(coinName, JSON.stringify(storeData));
        changes = [ ...changes, `${emoji}  ${dailyMovement}% ${arrowEmoji} ${util.asUSD(storeData.USD)}   ${util.asGBP(storeData.USD)}`];
      }
    } else {
      cache.put(coinName, JSON.stringify(storeData));
    }
  }

  if (changes.length) {
    const message = changes.reduce((acc, val) => acc + '\n' + val);
    util.sendToSlack(message);
    if (forced) res.status(204).send();
  }
};

setTimeout(() => update24(), 30000);

router.get('/', (_, res) => res.send(JSON.stringify(coins)));

router.all('/now', (_, res)  => update(true, res));

cron.schedule('* * * * *', () => update(false));

cron.schedule('0 0 * * *', () => update24());

cron.schedule('0 0 * * *', () => util.getConversion());

module.exports = router;
