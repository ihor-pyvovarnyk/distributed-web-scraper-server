const ServerNode = require('./server-node.js');

var node = new ServerNode('https://habrahabr.ru/page%d/');
node.run()
    .then(() => {
        console.log('Done');
    })
    .catch(error => {
        console.log('Server node error:', error);
    });
