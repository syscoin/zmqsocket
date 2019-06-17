const http = require('http');
const sockjs = require('sockjs');
const zmq = require('zeromq');
const sock = zmq.socket('sub');

const TOPIC = {
  RAW_BLOCK: 'rawblock',
  RAW_TX: 'rawtx',
  HASH_BLOCK: 'hashblock',
  HASH_TX: 'hashtx',
  WALLET_STATUS: 'walletstatus',
  ETH_STATUS: 'ethstatus',
  NETWORK_STATUS: 'networkstatus',
  WALLET_RAW_TX: 'walletrawtx'
};

module.exports = {
  startServer (config = {zmq_address: null, ws_port: null}, onReady = () => {}, onReadyToIndex = () => {}, onError = () => {}) {
    console.log("ZQMSocket starting with config:", JSON.stringify(config));

    if(typeof config.zmq_address !== 'string' && typeof config.ws_port !== 'number') {
      console.log("Bad config. Exiting.");
      process.exit(0);
    }

    // connect to ZMQ
    sock.connect(config.zmq_address);

    if (process.env.DEV) {
      console.log('dev mode.');
      sock.on('message', function (topic, message) {
        //console.log('[raw] TOPIC:', topic, ' MESSAGE', message);
        switch (topic.toString('utf8')) {
          case TOPIC.NETWORK_STATUS:
          case TOPIC.WALLET_RAW_TX:
          case TOPIC.WALLET_STATUS:
          case TOPIC.ETH_STATUS:
            console.log('[->client] JSON TOPIC:', topic.toString('utf8'), ' MESSAGE', message.toString());
            break;

          default:
            console.log('[~debug~] HEX TOPIC:', topic.toString('utf8'), ' MESSAGE', message.toString('hex'));
        }
      });
    }

    sock.subscribe(TOPIC.HASH_BLOCK);
    sock.subscribe(TOPIC.WALLET_STATUS);
    sock.subscribe(TOPIC.ETH_STATUS);
    sock.subscribe(TOPIC.NETWORK_STATUS);
    sock.subscribe(TOPIC.WALLET_RAW_TX);

    // create websocket server
    const echo = sockjs.createServer({prefix: '/zmq'});
    let clientConn;

    // setup websocket
    echo.on('connection', function (conn) {
      console.log("client connected");
      clientConn = conn;

      conn.on('close', function () {
        console.log("client disconnected");
      });
    });

    sock.on('message', (topic, message) => { handleMessage(topic, message, clientConn); });

    const server = http.createServer();
    echo.installHandlers(server);
    server.listen(config.ws_port, '0.0.0.0');

    // let external processes know we're ready
    onReady();
  }
};

function handleMessage(topic, message, conn) {
  if (conn) {
    if (!process.env.DEV) {
      console.log(topic.toString('utf8'));
    }
    let msgPayload;
    switch (topic.toString('utf8')) {
      case TOPIC.NETWORK_STATUS:
      case TOPIC.WALLET_RAW_TX:
      case TOPIC.WALLET_STATUS:
      case TOPIC.ETH_STATUS:
        msgPayload = message.toString();
        break;

      default:
        msgPayload = message.toString('hex');
    }

    conn.write(JSON.stringify({topic: topic.toString('utf8'), message: msgPayload}));
  }
}
