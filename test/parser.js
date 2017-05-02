const assert = require('assert');
const Parser = require('../lib/base/parser.js');
const Loader = require('../lib/base/loader.js');

const requestTimeout = 5000;
const exampleHtml = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>Page title</title>
        </head>
        <body>
            <h1>H1 title</h1>
            <p>Paragraph text</p>
            <div class="link-container">
                <a href="https://www.google.com">Link</a>
            </div>
            <ul class="my-list">
                <li>item 1</li>
                <li>item 2</li>
                <li>item 3</li>
            </ul>
        </body>
    </html>
`;

describe('Parser class', function() {

    it('should create Parser object', () => {
        let parser = new Parser();
        assert(parser instanceof Parser);
    });

    it('should successfully parse example html', basicTest(false));
    it('should have all required properties in result data object', basicTest(true));

    it('should find head>title', selectorTest('head>title', 1, 'Page title'));
    it('should find single h1 tag', selectorTest('h1', 1, 'H1 title'));
    it('should find single p tag', selectorTest('p', 1, 'Paragraph text'));
    it('should find all items in list ul.my-list', selectorTest('ul.my-list>li', 3));

    it('should load https://www.google.com, parse and check title', testWithLoader('https://www.google.com', 'Google'));

    function basicTest(isCheckData) {
        function handler(done) {
            let parser = new Parser();
            parser.parse({body: exampleHtml})
                .then((data) => {
                    if (!isCheckData || (data.document && data.window && data.$ && data.jQuery)) {
                        done();
                    } else {
                        done('Some of parser response data properties are missing')
                    }
                })
                .catch(done);
        }
        return handler;
    }

    function selectorTest(selector, expectedCount=1, expectedText=false) {
        function handler(done) {
            let parser = new Parser();
            parser.parse({body: exampleHtml})
                .then((data) => {
                    let {$} = data;
                    let nodes = $(selector);
                    if (expectedCount !== 0 && nodes.length == 0) {
                        done(`Didn't find node(s) by selector '${selector}'`);
                    } else if (expectedCount !== false && nodes.length != expectedCount) {
                        done(`Wrong number of nodes found by selector '${selector}'`);
                    } else if (expectedText !== false && nodes.text() != expectedText) {
                        done(`Found wrong text by selector '${selector}'`);
                    } else {
                        done();
                    }
                })
                .catch(done);
        }
        return handler
    }

    function testWithLoader(address, expectedText) {
        function handler(done) {
            this.timeout(requestTimeout);
            var loader = new Loader();
            loader.load(address)
                .then((rawData) => {
                    let {body, response} = rawData;
                    if (response.statusCode === 200 &&
                        typeof body === 'string' && body !== '') {
                        let parser = new Parser();
                        parser.parse(rawData)
                            .then((data) => {
                                let {$} = data;
                                let title = $('head>title');
                                if (title.length === 0) {
                                    done('Didn\'t find title node');
                                } else if (title.text() !== expectedText) {
                                    done('Found wrong text in title');
                                } else {
                                    done();
                                }
                            })
                            .catch(done);
                    } else if (response.statusCode !== 200) {
                        done('Wrong status code');
                    } else if (typeof body !== 'string') {
                        done('Wrong body property type in results');
                    } else if (body !== '') {
                        done('Empty body');
                    }
                })
                .catch(done);
        }
        return handler;
    }

});
