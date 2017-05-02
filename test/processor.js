const assert = require('assert');
const Parser = require('../lib/base/parser.js');
const Processor = require('../lib/base/processor.js');

const exampleHtml = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>Page title</title>
        </head>
        <body>
            <article class="post">
                <span class="rate">3.14</span>
                <h1 class="post-title">H1 title</h1>
                <div class="post-body">
                    <p>Paragraph text 1</p>
                    <p>Paragraph text 2</p>
                </div>
                <div class="links-container"><a href="https://www.google.com">Link</a></div>
                <ul class="tags">
                    <li class="tag">tag1</li>
                    <li class="tag">tag2</li>
                    <li class="tag">tag3</li>
                </ul>
                <div class="comments-section">
                    <div>Comments count: <span id="comments-count">3</span></div>
                    <ul class="comments-list">
                        <li class="comment">
                            <span class="message">comment 1</span>
                            <ul class="comments-list replies">
                                <li class="comment">
                                    <span class="message">comment 1.1</span>
                                    <ul class="comments-list replies">
                                        <li class="comment">
                                            <span class="message">comment 1.1.1</span>
                                        </li>
                                    </ul>
                                </li>
                                <li class="comment">
                                    <span class="message">comment 1.2</span>
                                    <ul class="comments-list replies"></ul>
                                </li>
                            </ul>
                        </li>
                        <li class="comment">
                            <span class="message">comment 2</span>
                            <ul class="comments-list replies"></ul>
                        </li>
                        <li class="comment">
                            <span class="message">comment 3</span>
                        </li>
                    </ul>
                </div>
            </article>
        </body>
    </html>
`;

const exampleExtractionTemplate = {
    data: {
        rate: "&rate",
        title: "&title",
        paragraphsCount: "&paragraphsCount",
        tags: "&tags",
        link: "&link",
        comments: {
            count: "&commentsCount",
            tree: "&commentsTree"
        }
    },
    getters: {
        rate: {
            $find: {$selector: ".post>span.rate", $get: "float"}
        },
        title: {
            $find: {$selector: ".post-title", $get: "text"}
        },
        tags: {
            $find: {$selector: "ul.tags li.tag", $each: {$get: "text"}}
        },
        paragraphsCount: {
            $find: {$selector: ".post-body p", $get: "size"}
        },
        link: {
            html: {
                $find: {$selector: ".links-container", $get: "html"}
            },
            address: {
                $find: {$selector: ".links-container a", $get: {$attribute: "href"}}
            }
        },
        commentsCount: {
            $find: {$selector: "#comments-count", $get: "int"}
        },
        commentsTree: {
            "$find": {$selector: ".comments-section > ul.comments-list > li.comment", $each: {$get: "&singleTreeComment"}}
        },
        singleTreeComment: {
            text: {
                $find: {$selector: "> .message", $get: "text"}
            },
            replies: {
                $find: {$selector: "> ul.comments-list.replies > li.comment", $each: {$get: "&singleTreeComment"}}
            }
        }
    }
};

describe('Processor class', function() {

    it('should create Processor object', () => {
        let processor = new Processor();
        assert(processor instanceof Processor);
    });

    it('should extract data from example html by extraction template', (done) => {
        async function asyncAction() {
            let parser = new Parser();
            let processor = new Processor();

            let data = await parser.parse({body: exampleHtml});
            let results = await processor.process(data, exampleExtractionTemplate);
            assert.deepEqual(results, {
                rate: 3.14,
                title: "H1 title",
                paragraphsCount: 2,
                tags: ['tag1', 'tag2', 'tag3'],
                link: {
                    html: '<a href="https://www.google.com">Link</a>',
                    address: 'https://www.google.com'
                },
                comments: {
                    count: 3,
                    tree: [
                        {text: 'comment 1', replies: [
                            {text: 'comment 1.1', replies: [
                                {text: 'comment 1.1.1', replies: []}
                            ]},
                            {text: 'comment 1.2', replies: []}
                        ]},
                        {text: 'comment 2', replies: []},
                        {text: 'comment 3', replies: []}
                    ]
                }
            });
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

});
