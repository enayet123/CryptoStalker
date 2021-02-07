// this is where you paste your api key
const cryptoCompareStream = (subs) => {
  let apiKey = "a0f1f3f080db83824cf7d686227ed1669e62eb951a75ac526f5b70339c39e67a";
  const WebSocket = require('ws');
  const stream = new WebSocket('wss://streamer.cryptocompare.com/v2?api_key=' + apiKey);
  
  stream.on('open', function open() {
      var subRequest = {
          "action": "SubAdd",
          "subs": subs
      };
      stream.send(JSON.stringify(subRequest));
  });
  
  return stream;
}

module.exports = cryptoCompareStream;