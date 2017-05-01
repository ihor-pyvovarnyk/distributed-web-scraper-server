const jsdom = require("jsdom");

class Parser {

    constructor() {
        this.config = {};
    }

    parse(rawData) {
        return new Promise((resolve, reject) => {
            let {body, response} = rawData; // Extract raw data
            let document = jsdom.jsdom(body, {});
            let window = document.defaultView;
            require("jquery")(window);
            let data = {document, window, $: window.$, jQuery: window.$};
            resolve(data);
        });
    }

}

module.exports = Parser;