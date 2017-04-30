const scraperConfig = require('../scraper.json');
const request = require('request');

class MasterNode {

    constructor() {
        this.nodes = scraperConfig.scraperServerNodes;
        this.isRunning = false;
    }

    run() {
        console.log("MASTER RUN");
        this.isRunning = true;
        this.asyncRun()
            .then(() => {
                console.log("MASTER: DONE");
                this.isRunning = false;
            })
            .catch((error) => {
                console.log("MASTER ERROR", error);
                this.isRunning = false;
            })
    }

    async asyncRun() {
        try {
            console.log("NODES LIST", this.nodes);
            await this.initNodes();
            let urls = await this.collect();
            console.log("COLLECTED_URLS", urls);
            await this.scrap(urls);
            return true;
        } catch (error) {
            console.log("MASTER RUN ERROR", error);
        }
    }

    async initNodes() {
        try {
            for (let i = 0; i < this.nodes.length; i++) {
                let node = this.nodes[i];
                let res = await this.request(node + '/node');
                console.log("MASTER: init node " + (i + 1), res)
            }
            return true;
        } catch (error) {
            console.log("MASTER INIT NODES ERROR", error);
        }
    }

    async collect() {
        return new Promise((resolve, reject) => {
            try {
                let allUrls = [];
                // TODO: Use Promise.all instead of counters
                let loadedResultsCounter = 0;
                let counterTick = () => {
                    loadedResultsCounter++;
                    if (loadedResultsCounter == this.nodes.length) {
                        resolve(allUrls);
                    }
                };
                for (let i = 0; i < this.nodes.length; i++) {
                    let node = this.nodes[i];
                    let address = node + '/collect?startFrom=' + (i+1) + '&increment=' + this.nodes.length;
                    console.log("COLLECT ADDRESS", address);
                    this.request(address)
                        .then((res) => {
                            if (res.status == 0) {
                                allUrls = allUrls.concat(res.urls)
                            }
                            counterTick();
                        })
                        .catch((error) => {
                            console.log("MASTER COLLECT ERROR1", error);
                            counterTick();
                        });
                }
            } catch (error) {
                console.log("MASTER COLLECT ERROR2", error);
                reject(error);
            }
        });
    }

    async scrap(urls) {
        return new Promise((resolve, reject) => {
            try {
                let packSize = 10;
                // TODO: Use Promise.all instead of counters
                let loadedResultsCounter = 0;
                let counterTick = () => {
                    loadedResultsCounter++;
                    if (loadedResultsCounter == this.nodes.length) {
                        resolve();
                    }
                };
                for (let k = 0; k < this.nodes.length; k++) {
                    this._scrapNode(k, this.nodes[k], urls, packSize)
                        .then(() => {
                            counterTick();
                        })
                        .catch((error) => {
                            console.log("MASTER SCRAP ERROR1", error);
                            counterTick();
                        });
                }
            } catch (error) {
                console.log("MASTER SCRAP ERROR2", error);
                reject(error);
            }
        });
    }

    async _scrapNode(k, node, urls, packSize) {
        try {
            for (let i = 0; i < urls.length && this.nodes.length > 0; i += (packSize * this.nodes.length)) {
                let offset = i + k * packSize;
                let urlsPack = urls.slice(offset, offset + packSize);
                console.log("URLS PACK", urlsPack);
                let address = node + '/scrap?bulkSize=5&urls=' + encodeURIComponent(urlsPack.join(','));
                console.log("SCRAP ADDRESS", address);
                let res = await this.request(address);
                console.log("MASTER: ran " + (i+1) + " scrap in node " + (k + 1), res);
            }
        } catch (error) {
            console.log("MASTER SCRAP NODE ERROR", error);
        }
    }

    request(address) {
        return new Promise((resolve, reject) => {
            try {
                request(address, (error, response, body) => {
                    if (error) {
                        reject(error);
                    }
                    try {
                        resolve(JSON.parse(body));
                    } catch (error) {
                        console.log("MASTER REQUEST JSON ERROR", error);
                        reject(error);
                    }
                });
            } catch (error) {
                console.log("MASTER REQUEST ERROR", error);
            }
        });
    }

}

module.exports = MasterNode;