const http = require('http');
const sockjs = require('sockjs');
const zmq = require('zeromq');
const sock = zmq.socket('sub');

// connect to ZMQ
sock.connect('tcp://127.0.0.1:28332');
console.log('ZMQ connected to port 28332');
sock.subscribe('hashblock');
sock.subscribe('hashtx');
//sock.subscribe('rawblock');
//sock.subscribe('rawtx');

// create websocket server
const echo = sockjs.createServer({ prefix:'/zmq' });

// setup websocket
echo.on('connection', function(conn) {
  console.log("client connected");

  conn.on('data', function(message) {
    sock.on('message', function(topic, message) {
      //console.log('[raw] TOPIC:', topic, ' MESSAGE', message);
      console.log('TOPIC:', topic.toString('utf8'), ' MESSAGE', message.toString('hex'));

      conn.write('marker', { topic: topic.toString('utf8'), message: message.toString('hex')});
    });
  });
  conn.on('close', function() {});
});

const server = http.createServer();
echo.installHandlers(server);
server.listen(9999, '0.0.0.0');


