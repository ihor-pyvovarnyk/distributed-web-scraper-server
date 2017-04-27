const printf = require('printf');

const Loader = require('./base/loader.js');
const Parser = require('./base/parser.js');
const Processor = require('./base/processor.js');

class UrlCollector {

    constructor(collectorUrl) {
        this.collectorUrl = collectorUrl;
        this.collectedUrls = [];
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
            for (let page = 1; true; page++) {
                let address = printf(this.collectorUrl, page);
                let rawData = await this.loader.asyncLoad(address);
                let data = await this.parser.asyncParse(rawData);
                let {urls} = await this.processor.asyncProcess(data);
                this.collectedUrls = this.collectedUrls.concat(urls);
                if (urls.length == 0) {
                    break;
                }
            }
            resolve(this.collectedUrls);
        } catch (error) {
            console.error('collector error', error);
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