const _ = require('lodash');
const url = require('url');

const Loader = require('./../base/loader.js');
const Parser = require('./../base/parser.js');
const Processor = require('./../base/processor.js');

class UrlCollector {

    constructor(config) {
        this.urlTemplate = config.paginationUrlTemplate;
        this.targetLinksSelector = config.targetLinksSelector || 'a';
        this.offset = config.offset || 0;
        this.step = config.step || 1;
        this.pageKey = config.pageKey || '{PAGE_NUMBER}';
        this.pagesLimit = config.pagesLimit || 5;//1000000
        this.isVerbose = config.verbose;

        this.loader = new Loader();
        this.parser = new Parser();
        this.processor = new Processor();
        this.extractionTemplate = {
            data: {
                urls: {
                    $find: {
                        $selector: this.targetLinksSelector,
                        $each: {$get: {$attribute: "href"}}
                    }
                }
            }
        };
    }

    _pages() {
        function* _getPages() {
            for (var page = 1 + this.offset;
                 page <= this.pagesLimit;
                 page += this.step) {
                yield {page, address: this.urlTemplate.replace(this.pageKey, page)};
            }
        }
        return _getPages.bind(this)();
    }

    async collect() {
        let collectedUrls = [];
        for (let {address} of this._pages()) {
            this.log(`Collect from ${address}`);
            let rawData = await this.loader.load(address);
            let data = await this.parser.parse(rawData);
            let {urls} = await this.processor.process(data, this.extractionTemplate);
            if (urls.length == 0) {
                break;
            }
            collectedUrls = collectedUrls.concat(urls.map(a => this._urlProcess(a, address)));
        }
        return _.uniqWith(collectedUrls);
    }

    _urlProcess(linkAddress, pageAddress) {
        let linkUrl = url.parse(linkAddress);
        if (linkUrl.host === null) {
            let pageUrl = url.parse(pageAddress);
            let prefix = `${pageUrl.protocol}//${pageUrl.host}`;
            if (linkAddress[0] !== '/') { // from root
                prefix += pageUrl.pathname;
            }
            linkAddress = prefix + linkAddress;
        }
        return linkAddress;
    }

    log(...args) {
        if (this.isVerbose) {
            console.log(`UrlCollector:`, ...args);
        }
    }

    error(...args) {
        console.error(`UrlCollector:`, ...args);
    }

}

module.exports = UrlCollector;