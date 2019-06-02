var app = require('http').createServer(handler),
  io = require('socket.io')({
    log_level: 3,
    transports: [ 'websocket' ]
  });
  io.listen(app),
  fs = require('fs'),
  zmq  = require('zmq'),
  receiver = zmq.socket('pull');

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }

      res.writeHead(200);
      res.end(data);
    });
}

// subber.js
var zmq = require('zmq')
  , sock = zmq.socket('sub');

sock.connect('tcp://127.0.0.1:28332');
sock.subscribe('hashblock');
sock.subscribe('hashtx');
//sock.subscribe('rawblock');
//sock.subscribe('rawtx');

console.log('Subscriber connected to port 28332');

io.sockets.on('connection', function (socket) {
  console.log("client connect");
  sock.on('message', function(topic, message) {
    //console.log('[raw] TOPIC:', topic, ' MESSAGE', message);
    console.log('TOPIC:', topic.toString('utf8'), ' MESSAGE', message.toString('hex'));

    socket.emit('marker', { topic: topic.toString('utf8'), message: message.toString('hex')});
  });

  receiver.on('message', function(message) {
    socket.emit('marker', { 'message': escape(message) });
  });
});

receiver.bindSync("tcp://*:5558");
