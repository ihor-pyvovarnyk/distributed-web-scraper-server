class Processor {

    constructor() {
        this.config = {};
    }

    asyncProcess(data) {
        return new Promise((resolve, reject) => {
            try {
                this.process(data, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    }

    process(data, resolve, reject) {
        let {document, window, $, jQuery} = data; // Extract data
        let results = {title: $('title').text()};
        resolve(results);
    }

}

module.exports = Processor;