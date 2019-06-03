const http = require('http');
const sockjs = require('sockjs');
const zmq = require('zeromq');
const sock = zmq.socket('sub');

// connect to ZMQ
sock.connect('tcp://127.0.0.1:28332');

if(process.env.DEV_MODE) {
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
const echo = sockjs.createServer({ prefix:'/zmq' });
let clientConn;

// setup websocket
echo.on('connection', function(conn) {
  console.log("client connected");
  clientConn = conn;

  conn.on('close', function() {
    console.log("client disconnected");
  });
});

sock.on('message', handleMessage);

function handleMessage(topic, message) {
  if(clientConn) {
    //console.log('[raw] TOPIC:', topic, ' MESSAGE', message);
    console.log('[->client] TOPIC:', topic.toString('utf8'), ' MESSAGE', message.toString('hex'));

    clientConn.write(JSON.stringify({topic: topic.toString('utf8'), message: message.toString('hex')}));
  }
}

const server = http.createServer();
echo.installHandlers(server);
server.listen(9999, '0.0.0.0');


