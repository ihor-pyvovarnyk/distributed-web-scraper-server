const request = require('request');

class Loader {

    constructor() {
        this.config = {};
    }

    asyncLoad(address) {
        return new Promise((resolve, reject) => {
            try {
                this.load(address, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    }

    load(address, resolve, reject) {
        request(address, (error, response, body) => {
            if (error) {
                reject(error);
            }
            let rawData = {body, response};
            resolve(rawData);
        });
    }

}

module.exports = Loader;