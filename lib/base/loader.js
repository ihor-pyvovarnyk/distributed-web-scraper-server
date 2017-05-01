const request = require('request');

class Loader {

    constructor() {
        this.config = {};
    }

    load(address) {
        return new Promise((resolve, reject) => {
            request(address, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                let rawData = {body, response};
                resolve(rawData);
            });
        });
    }

}

module.exports = Loader;