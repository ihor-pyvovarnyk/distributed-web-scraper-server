class AbstractNode {

    constructor(config, port) {
        this.config = config;
        this.port = port;
        this.jobs = [];
    }

}

module.exports = AbstractNode;