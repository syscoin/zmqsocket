const server = require('./server');
console.log("ZMQ");

module.exports.startServer = function(config, onReady ,onReadyToIndex ,onError) {
  server.startServer(...arguments);
};


if(process.env.DEV) {
  const config = require('./config');
  this.startServer(config);
}


