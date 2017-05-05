const _ = require('lodash');

const Loader = require('./../base/loader.js');
const Parser = require('./../base/parser.js');
const Processor = require('./../base/processor.js');
const Storage = require('./../base/storage.js');

class DataFetcher {

    constructor(config) {
        this.saveListMaxSize = config.saveListMaxSize;
        this.dataExtractionTemplate = config.dataExtractionTemplate;
        this.storageConfig = config.storageConfig;
        this.isVerbose = config.verbose;

        this.loader = new Loader();
        this.parser = new Parser();
        this.processor = new Processor();
        this.storage = new Storage({
            host: this.storageConfig.host,
            port: this.storageConfig.port,
            dbName: this.storageConfig.dbName
        });
    }

    async fetch(urls) {
        let urlsChunks = _.chunk(urls, this.saveListMaxSize);
        for (let urlsSet of urlsChunks) {
            let pendingFetches = urlsSet.map(this._fetchOne.bind(this));
            let resultsSet = await Promise.all(pendingFetches);
            await this._savePortion(resultsSet);
        }
    }

    async _fetchOne(url) {
        this.log(`Fetch data from ${url}`);
        let rawData = await this.loader.load(url);
        let data = await this.parser.parse(rawData);
        return await this.processor.process(data, this.dataExtractionTemplate);
    }

    async _savePortion(docs) {
        try {
            await this.storage.connect();
            this.storage.setCollection(this.storageConfig.collection);
            await this.storage.insertMany(docs);
        } finally {
            this.storage.close();
        }
    }

    log(...args) {
        if (this.isVerbose) {
            console.log(`DataFetcher:`, ...args);
        }
    }

    error(...args) {
        console.error(`DataFetcher:`, ...args);
    }

}

module.exports = DataFetcher;