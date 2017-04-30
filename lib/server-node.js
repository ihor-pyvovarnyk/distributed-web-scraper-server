const StorageClient = require('./base/storage-client.js');
const UrlCollector = require('./url-collector.js');
const Scraper = require('./scraper.js');

// TODO: check does function async: foo instanceof Function == false && typeof foo == 'function'
// TODO: or just force to make needed methods async
class ServerNode {

    constructor() {
        this.collector = new UrlCollector();
        this.scraper = new Scraper();
        this.storage = new StorageClient();
    }

    async collect(collectorUrl, startFrom, pagesIncrementer) {
        try {
            this.collector.collectorUrl = collectorUrl;
            this.collector.startFrom = startFrom;
            this.collector.pagesIncrementer = pagesIncrementer;
            return await this.collector.asyncCollect();
        } catch (error) {
            console.error('Collect error', error);
        }
    }

    async scrap(urls) {
        try {
            return await this.scraper.asyncScrap(urls);
        } catch (error) {
            console.error('Scrap error', error);
        }
    }

    async store(data) {
        try {
            try {
                await this.storage.asyncConnect();
                for (let post of data) {
                    await this.storage.asyncSave(post);
                }
            } finally {
                await this.storage.asyncClose();
            }
            return true
        } catch (error) {
            console.error('Store error', error);
        }
    }

    //async runAll() {
    //    try {
    //        let urls = await this.collector.asyncCollect();
    //        let data = await this.scraper.asyncScrap(urls);
    //
    //        //// TODO: add layer between processing and storing called packager
    //        //// TODO: or something, which will pack precessed data into different
    //        //// TODO: kind of objects, some storage client can handle where to store
    //        //// TODO: different kind of data (in different tables/collections);
    //
    //        await this.storage.asyncConnect();
    //        for (let post of data) {
    //            await this.storage.asyncSave(post);
    //        }
    //        await this.storage.asyncClose();
    //        console.log(data);
    //
    //        return true;
    //    } catch (error) {
    //        console.error('Async error', error);
    //    }
    //}

}

module.exports = ServerNode;