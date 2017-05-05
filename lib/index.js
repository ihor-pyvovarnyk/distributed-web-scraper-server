const argv = require('yargs').argv;

const MasterNode = require('./nodes/master-node.js');
const WorkerNode = require('./nodes/worker-node.js');
const nodeConfig = require('../node-config.json');

const Node = argv.master ? MasterNode : WorkerNode;
var node = new Node(nodeConfig, argv.port);
node.start();