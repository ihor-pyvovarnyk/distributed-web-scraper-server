const Loader = require('./base/loader.js');
const Parser = require('./base/parser.js');
const Processor = require('./base/processor.js');

class ServerNode {

    constructor(address) {
        this.address = address;
        this.loader = null;
        this.parser = null;
        this.processor = null;
    }

    init() {
        this.loader = new Loader();
        this.parser = new Parser();
        this.processor = new Processor();
    }

    async run() {
        let rawData = await this.loader.asyncLoad(this.address);
        let data = await this.parser.asyncParse(rawData);
        let results = await this.processor.asyncProcess(data);
        return results;
    }

}

ServerNode.init = (address) => {
    let serverNode = new ServerNode(address);
    serverNode.init();
    return serverNode;
};

module.exports = ServerNode;