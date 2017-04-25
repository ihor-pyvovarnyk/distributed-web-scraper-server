const jsdom = require("jsdom");

class Parser {

    constructor() {
        this.config = {};
    }

    asyncParse(rawData) {
        return new Promise((resolve, reject) => {
            try {
                this.parse(rawData, resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    }

    parse(rawData, resolve, reject) {
        let {body, response} = rawData; // Extract raw data
        let document = jsdom.jsdom(body, {});
        let window = document.defaultView;
        jsdom.jQueryify(
            window,
            "http://code.jquery.com/jquery-2.1.1.js",
            () => {
                let data = {document, window, $: window.$, jQuery: window.$};
                resolve(data);
            }
        );
    }

}

module.exports = Parser;