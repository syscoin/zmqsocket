import dotenv from 'dotenv';
dotenv.load({ silent: true });

export const Config = {
  zmq_address: process.env.ZMQ_ADDRESS || 'tcp://127.0.0.1:28332',
  ws_port: process.env.WA_PORT || 9999,
};
