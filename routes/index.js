const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const util = require('./util');
const constants = require('./constants');
const cache = require('memory-cache');
const CryptoCompare = require('./cryptocompare');
const env = require('dotenv');
const yaml = require('yaml');
const fs = require('fs');

env.config();

const envKeys = ["PORT", "VERBOSE", "DEBUG", "EXCHANGE_HTTPS", "EXCHANGE_PARAMS", "EXCHANGE_KEY", "CRYPTO_COMPARE_WEBSOCKET", "CRYPTO_COMPARE_API", "SLACK_HOOK_URL_GENERAL", "COINS"];
console.log("[ENVIR]");
envKeys.forEach(key => console.log("  ", key, process.env[key]));

// Create coins.yml file if not exists
if (!fs.existsSync(constants.COIN_FILE))
  fs.open(constants.COIN_FILE, 'w', (err) => {
    if (err) throw err;
    console.log('[FILE]', 'Created new ' + constants.COIN_FILE + ' file')
  })

console.log(process.env.COINS)
// Obj used to store current prices, acting as a sort of dictionary

// const store = {};
// const coins = JSON.parse(process.env.COINS);
// const subs = util.getSubscriptions(coins);
// let stream = CryptoCompare.connect().withReconnect().subscribe(subs).addTradeListener(store);
// // cryptocompare.registerStream({ stream, store });
// util.getConversion();

// const update24 = () => {
//   const stored = { ...store };

//   for (const coinName in stored) {
//     cache.put(`${coinName}24`, JSON.stringify(stored[coinName]));
//   }
// }

// const update = (forced, res) => {
//   let changes = [];
//   const cached = JSON.parse(cache.get(constants.STORE));

//   for (const coinName in cached) {
//     const storeData = { ...store }[coinName];
//     const cacheData = JSON.parse(cache.get(coinName));
//     const cache24Data = JSON.parse(cache.get(`${coinName}24`));
    
//     if (cache24Data && cacheData) {
//       const margin = coins[coinName].margin;
//       const difference = Math.abs(storeData.USD - cacheData.USD);
      
//       if (difference > margin || forced) {
//         const emoji = coins[coinName].emoji;
//         const { delta, dailyMovement, arrowEmoji, arrow24Emoji } = util.getStats(cache24Data, cacheData, storeData);
//         cache.put(coinName, JSON.stringify(storeData));
//         changes = [ ...changes, `${emoji} ${arrowEmoji} $${delta} → ${util.asUSD(storeData.USD)} ≅ ${util.asGBP(storeData.USD)} ${arrow24Emoji} ${dailyMovement}%`];
//       }
//     } else {
//       cache.put(coinName, JSON.stringify(storeData));
//     }
//   }

//   if (changes.length) {
//     const message = changes.reduce((acc, val) => acc + '\n' + val);
//     util.sendToSlack(message);
//     if (forced) res.status(204).send();
//   }
// };

// setTimeout(() => update24(), 30000);

// router.get('/', (_, res) => res.json(coins));

// router.all('/now', (_, res)  => update(true, res));

// cron.schedule('* * * * *', () => update(false));

// cron.schedule('0 0 * * *', () => update24());

// cron.schedule('0 0 * * *', () => util.getConversion());

module.exports = router;
