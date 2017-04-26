const ServerNode = require('./server-node.js');

var node = ServerNode.init('http://bookforum.ua/events/');
node.run()
    .done(results => {
        console.log(`Title: ${results.title}`);
    })
    .catch(error => {
        console.log('Server node error:', error);
    });
