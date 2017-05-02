const assert = require('assert');
const Loader = require('../lib/base/loader.js');

const requestTimeout = 5000;

describe('Loader class', function() {

    it('should create Loader object', () => {
        let loader = new Loader();
        assert(loader instanceof Loader);
    });

    it('should load http://www.google.com', successLoad('http://www.google.com', 'Google'));
    it('should load https://www.google.com', successLoad('https://www.google.com', 'Google'));

    it('should not load http://wrong.address/', failedLoad('http://wrong.address/'));
    it('should not load https://wrong.address/', failedLoad('https://wrong.address/'));

    function successLoad(address, contain) {
        function handler(done) {
            this.timeout(requestTimeout);
            var loader = new Loader();
            loader.load(address)
                .then((data) => {
                    let {body, response} = data;
                    if (response.statusCode === 200 &&
                        typeof body === 'string' && body !== '' &&
                        body.indexOf(contain) !== -1) {
                        done();
                    } else if (response.statusCode !== 200) {
                        done('Wrong status code');
                    } else if (typeof body !== 'string') {
                        done('Wrong body property type in results');
                    } else if (body === '') {
                        done('Empty body');
                    } else if (body.indexOf(contain) === -1) {
                        done('Didn\'t find substring in body');
                    }
                })
                .catch(done);
        }
        return handler;
    }

    function failedLoad(address) {
        function handler(done) {
            this.timeout(requestTimeout);
            var loader = new Loader();
            loader.load(address)
                .then((data) => {
                    if (data.response.statusCode < 400) {
                        done('Should not have success or redirect status code');
                    } else {
                        done();
                    }
                })
                .catch((error) => {
                    done();
                });
        }
        return handler;
    }

});
