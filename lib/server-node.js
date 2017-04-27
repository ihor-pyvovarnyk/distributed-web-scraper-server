const StorageClient = require('./base/storage-client.js');
const UrlCollector = require('./url-collector.js');
const Scraper = require('./scraper.js');

class ServerNode {

    constructor(collectorUrl) {
        this.collector = new UrlCollector(collectorUrl);
        this.scraper = new Scraper();
        this.storage = new StorageClient();
    }

    async run() {
        try {
            let urls = await this.collector.asyncCollect();
            let data = await this.scraper.asyncScrap(urls);

            await this.storage.asyncConnect();
            for (let post of data) {
                await this.storage.asyncSave(post);
            }
            await this.storage.asyncClose();

            return true;
        } catch (error) {
            console.error('Async error', error);
        }
    }

}

module.exports = ServerNode;