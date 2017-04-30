const MongoClient = require('mongodb').MongoClient;

class StorageClient {

    constructor() {
        this.config = {};
        this.host = 'localhost';
        this.port = '27017';
        this.name = 'web-scrapper';
        this.db = null;
        this.collection = 'testCollection';
    }

    get url() {
        let {host, port, name} = this;
        return `mongodb://${host}:${port}/${name}`;
    }

    doAsync(callback) {
        return new Promise((resolve, reject) => {
            try {
                callback(resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    }

    asyncConnect() {
        return this.doAsync(this.connect.bind(this));
    }

    asyncSave(document) {
        return this.doAsync(this.save.bind(this, document));
    }

    asyncClose() {
        return this.doAsync(this.close.bind(this));
    }

    connect(resolve, reject) {
        MongoClient.connect(this.url, (err, db) => {
            if (err !== null) {
                reject(err);
            }
            this.db = db;
            resolve(true);
        });
    }

    save(document, resolve, reject) {
        var collection = this.db.collection(this.collection);
        collection.insertMany([
            document
        ], (err, result) => {
            if (err !== null) {
                reject(err);
            }
            //assert.equal(3, result.result.n);
            //assert.equal(3, result.ops.length);
            resolve(true);
        });
    }

    close(resolve, reject) {
        this.db.close();
        resolve(true);
    }

}

module.exports = StorageClient;