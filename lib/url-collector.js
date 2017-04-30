const printf = require('printf');

const Loader = require('./base/loader.js');
const Parser = require('./base/parser.js');
const Processor = require('./base/processor.js');

class UrlCollector {

    constructor() {
        this.collectorUrl = '';
        this.startFrom = 1;
        this.pagesIncrementer = 1;
        this.loader = new Loader();
        this.parser = new Parser();
        this.processor = new UrlCollectorProcessor();
    }

    asyncCollect() {
        return new Promise((resolve, reject) => {
            try {
                this.collect(resolve, reject)
                    .then(() => {}, () => {});
            } catch (e) {
                reject(e);
            }
        });
    }

    async collect(resolve, reject) {
        try {
            let collectedUrls = [];
            for (var page = this.startFrom; page <= 5; page += this.pagesIncrementer) { // TODO: remove page <= 1
                let address = printf(this.collectorUrl, page);
                console.log("Collect page number", page, address);
                let rawData = await this.loader.asyncLoad(address);
                let data = await this.parser.asyncParse(rawData);
                let {urls} = await this.processor.asyncProcess(data);
                collectedUrls = collectedUrls.concat(urls);
                console.log("Collected", page, urls.length, urls);
                if (urls.length == 0) {
                    break;
                }
            }
            console.log("Page after collect", page, this.pagesIncrementer);
            resolve(collectedUrls);
        } catch (error) {
            console.error('collector error', error);
            reject(error);
        }
    }

}

class UrlCollectorProcessor extends Processor {

    process(data, resolve, reject) {
        let {document, window, $, jQuery} = data; // Extract data
        let links = $('.post .post__title a.post__title_link');
        let urls = [];
        for (let i = 0; i < links.length; i++) {
            let link = links.eq(i);
            urls.push(link.attr('href'));
        }
        let results = {urls};
        resolve(results);
    }

}

module.exports = UrlCollector;