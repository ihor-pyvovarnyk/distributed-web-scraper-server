const argv = require('yargs').argv;

const Client = require('./client/client.js');
const nodeConfig = require('../node-config.json');
const workflow = require('../workflow.json'); // Hardcoded workflow for now

var client = new Client(nodeConfig, workflow);
client.start();
