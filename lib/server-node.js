const Loader = require('./base/loader.js');
const Parser = require('./base/parser.js');
const Processor = require('./base/processor.js');
const StorageClient = require('./base/storage-client.js');

class ServerNode {

    constructor(address) {
        this.address = address;
        this.loader = null;
        this.parser = null;
        this.processor = null;
        this.storage = null;
    }

    init() {
        this.loader = new Loader();
        this.parser = new Parser();
        this.processor = new Processor();
        this.storage = new StorageClient();
    }

    async run() {
        try {
            let rawData = await this.loader.asyncLoad(this.address);
            let data = await this.parser.asyncParse(rawData);
            let results = await this.processor.asyncProcess(data);

            await this.storage.asyncConnect();
            await this.storage.asyncSave(results);
            await this.storage.asyncClose();

            return results;
        } catch (error) {
            console.error('Async error');
        }
    }

}

ServerNode.init = (address) => {
    let serverNode = new ServerNode(address);
    serverNode.init();
    return serverNode;
};

module.exports = ServerNode;