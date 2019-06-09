const http = require('http');
const sockjs = require('sockjs');
const zmq = require('zeromq');
const sock = zmq.socket('sub');

console.log("ZMQ");

module.exports.startServer = function(config = { zmq_address: null, ws_port: null}, onReady, onReadyToIndex, onError) {
  console.log("ZQMSocket starting with config:", JSON.stringify(config));

  if(typeof config.zmq_address !== 'string' && typeof config.ws_port !== 'number') {
    console.log("Bad config. Exiting.");
    process.exit(0);
  }

  // connect to ZMQ
  sock.connect(config.zmq_address);

  if (process.env.DEV_MODE) {
    sock.on('message', function (topic, message) {
      //console.log('[raw] TOPIC:', topic, ' MESSAGE', message);
      console.log('[~debug~] TOPIC:', topic.toString('utf8'), ' MESSAGE', message.toString('hex'));
    });
  }

  sock.subscribe('hashblock');
  sock.subscribe('hashtx');
  //sock.subscribe('rawblock');
  //sock.subscribe('rawtx');

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

  sock.on('message', handleMessage);

  function handleMessage(topic, message) {
    if (clientConn) {
      //console.log('[raw] TOPIC:', topic, ' MESSAGE', message);
      console.log('[->client] TOPIC:', topic.toString('utf8'), ' MESSAGE', message.toString('hex'));

      clientConn.write(JSON.stringify({topic: topic.toString('utf8'), message: message.toString('hex')}));
    }
  }

  const server = http.createServer();
  echo.installHandlers(server);
  server.listen(config.ws_port, '0.0.0.0');

  // let external processes know we're ready
  onReady();
};


