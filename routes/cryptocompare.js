const constants = require('./constants');
const cache = require('memory-cache');
const util = require('./util');
const WebSocket = require('ws');

const CryptoCompare = {
  stream: null,
  reconnect: false,
  heartbeatTimeout: null,
  subscriptions: null,
  store: null,
  lastHeartbeat: Date.now(),

  heartbeat: function(self) {
    // const self = this;
    // this.lastHeartbeat = Date.now();
    // console.log(this.heartbeatTimeout)
    clearTimeout(self.heartbeatTimeout);
    // console.log(this.heartbeatTimeout)
    self.heartbeatTimeout = setTimeout(() => {
      console.log("[CONNECTION] TERMINATED")
      util.sendToSlack(`Something went wrong 🤔 I'll be back in a minute...`)
      self.stream.terminate();
      // const now = Date.now();
      // console.log(now, self.lastHeartbeat, now - self.lastHeartbeat)
    }, 65000);
  },

  connect: function() {
    const url = process.env.CRYPTO_COMPARE_WEBSOCKET + process.env.CRYPTO_COMPARE_API;
    console.log(`[CONNECTION] CONNECTED TO ${url}`);
    this.stream = new WebSocket(url);
    return this;
  },

  subscribe: function(subs) {
    this.subscriptions = subs;
    this.stream.on(constants.STREAM_OPEN, () => {
      const subRequest = { "action": "SubAdd", "subs": subs };
      this.stream.send(JSON.stringify(subRequest));
      // if (this.reconnect) {
      //   this.lastHeartbeat = Date.now();
      //   this.heartbeat(this.stream, this);
      // }
    });
    return this;
  },

  withReconnect: function() {
    const self = this;
    this.reconnect = true;
    this.stream.on(constants.STREAM_CLOSE, () => {
      console.log(`[CONNECTION] DELAYING RECONNECT`);
      setTimeout(function() { 
        const reconnect = self.connect(); 
        reconnect.withReconnect();
        reconnect.subscribe(self.subscriptions);
        reconnect.addTradeListener(self.store);
      }, 10000);
    });
    return this;
  },

  addTradeListener: function(store) {
    this.store = store;
    const self = this;
    const heartbeat = this.heartbeat;
    this.stream.on(constants.STREAM_MESSAGE, function incoming(data) {
      const msg = JSON.parse(data);

      if(!!process.env.DEBUG) {
        console.log("[DEBUG] " + data)
      }

      if (msg.TYPE === constants.MSG_TYPE) {
        if (!!process.env.VERBOSE)
          console.log(`[PRICE] ${msg.M} \t${msg.FSYM}: ${msg.P} ${msg.TSYM}`);
        if (!(`${msg.FSYM}` in store))
          store[`${msg.FSYM}`] = {};
        store[`${msg.FSYM}`][constants.USD] = msg.P;
        cache.put(constants.STORE, JSON.stringify(store));
      } else if (msg.TYPE === constants.HEARTBEAT_TYPE) {
        console.log("[HEARTBEAT] " + msg);
        this.lastHeartbeat = msg.TIMEMS;
        heartbeat(self);
      }

    });
    return this;
  },
};

module.exports = CryptoCompare;
