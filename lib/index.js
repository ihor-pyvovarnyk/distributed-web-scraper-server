const ServerNode = require('./server-node.js');

var node = ServerNode.init('http://bookforum.ua/events/');
node.run().then(results => {
    console.log(`Title: ${results.title}`);
});
