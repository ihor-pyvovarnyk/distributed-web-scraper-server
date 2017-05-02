class Processor {

    constructor() {
        this.config = {};
    }

    process(data, extractionTemplate) {
        return new Promise((resolve, reject) => {
            let {document, window, $, jQuery} = data; // Extract data
            let templateEngine = new TemplateEngine($, extractionTemplate);
            let results = templateEngine.compile();
            resolve(results);
        });
    }

}

// TODO: Change templates format
class TemplateEngine {

    constructor($, extractionTemplate) {
        this.$ = $;
        this.dataTemplate = extractionTemplate.data;
        this.gettersMap = extractionTemplate.getters;
        this.refPattern = /^&([0-9A-Z\-_]+)$/i;
    }

    compile() {
        return this._compileValue(this.dataTemplate);
    }

    _getter(name) {
        return this.gettersMap[name];
    }

    _fetchRef(value) {
        let ref = null;
        if (this.refPattern.test(value)) {
            ref = this._getter(value.match(this.refPattern)[1]);
        }
        return ref;
    }

    _compileValue(value, domContext=null) {
        let compiled = value;
        if (typeof value === 'object' && value !== null) {
            if (value.$find) {
                compiled = this._compileFind(value.$find, domContext);
            } else {
                compiled = {};
                Object.keys(value).map(key => {
                    compiled[key] = this._compileValue(value[key], domContext);
                });
            }
        } else if (Array.isArray(value)) {
            compiled = [];
            for (let item of value) {
                compiled.push(this._compileValue(item, domContext));
            }
        } else if (typeof value === 'string') {
            if (this.refPattern.test(value)) {
                let getter = this._fetchRef(value);
                compiled = this._compileValue(getter, domContext);
            }
        }
        return compiled;
    }

    _compileFind(findValue, domContext=null) {
        let value = null;
        let selector = findValue.$selector;
        let innerContext = domContext ? domContext.find(selector) : this.$(selector);
        if (findValue.$get) {
            value = this._compileGet(findValue.$get, innerContext);
        } else if (findValue.$each) {
            value = this._compileEach(findValue.$each, innerContext);
        }
        return value;
    }

    _compileGet(getValue, domContext) {
        let value = null;
        if (typeof getValue === 'string') {
            switch (getValue) {
                case 'text': value = domContext.text(); break;
                case 'int': value = parseInt(domContext.text(), 10); break;
                case 'float': value = parseFloat(domContext.text()); break;
                case 'html': value = domContext.html(); break;
                case 'size': value = domContext.length; break;
                default:
                    if (this.refPattern.test(getValue)) {
                        let getter = this._fetchRef(getValue);
                        value = this._compileValue(getter, domContext);
                    }
            }
        } else if (typeof getValue === 'object' && getValue !== null) {
            if (getValue.$attribute) {
                value = domContext.attr(getValue.$attribute);
            }
        }
        return value;
    }

    _compileEach(eachValue, domContext) {
        let value = [];
        for (let i = 0; i < domContext.length; i++) {
            let item = domContext.eq(i);
            if (eachValue.$get) {
                value.push(this._compileGet(eachValue.$get, item));
            }
        }
        return value;
    }

}

Processor.TemplateEngine = TemplateEngine;
module.exports = Processor;