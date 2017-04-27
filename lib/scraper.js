const Loader = require('./base/loader.js');
const Parser = require('./base/parser.js');
const Processor = require('./base/processor.js');

class Scraper {

    constructor() {
        this.loader = new Loader();
        this.parser = new Parser();
        this.processor = new ScraperProcessor();
    }

    asyncScrap(urls) {
        return new Promise((resolve, reject) => {
            try {
                this.scrap(urls, resolve, reject)
                    .then(() => {}, () => {});
            } catch (e) {
                reject(e);
            }
        });
    }

    async scrap(urls, resolve, reject) {
        try {
            let scraperData = [];
            for (let url of urls) {
                console.log("Scrap url:", url);
                let rawData = await this.loader.asyncLoad(url);
                let data = await this.parser.asyncParse(rawData);
                let results = await this.processor.asyncProcess(data);
                scraperData.push(results);
            }
            resolve(scraperData);
        } catch (error) {
            console.error('scraper error', error);
        }
    }

}

class ScraperProcessor extends Processor {

    process(data, resolve, reject) {
        let {document, window, $, jQuery} = data; // Extract data
        let title = $('.post__title-text').text();
        let tags = $('.post__tags ul.tags li a');
        let tagsList = [];
        for (let i = 0; i < tags.length; i++) {
            let tag = tags.eq(i);
            tagsList.push(tag.text());
        }
        let results = {title, tags: tagsList};
        resolve(results);
    }

}

module.exports = Scraper;