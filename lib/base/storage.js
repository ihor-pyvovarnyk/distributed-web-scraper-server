const MongoClient = require('mongodb').MongoClient;

class Storage {

    constructor(config) {
        this.config = config;
        this.db = null;
        this.collection = null;
    }

    get url() {
        let {host, port, dbName} = this.config;
        return `mongodb://${host}:${port}/${dbName}`;
    }

    connect() {
        return new Promise((resolve, reject) => {
            MongoClient.connect(this.url, (err, db) => {
                if (err !== null) {
                    reject(err);
                }
                this.db = db;
                this.collection = null;
                resolve(db);
            });
        });
    }

    setCollection(name) {
        if (this.db) {
            this.collection = this.db.collection(name);
        } else {
            throw new Error('Connect to database before selecting collection');
        }
    }

    insertOne(document) {
        return new Promise((resolve, reject) => {
            if (!this._validateDocument(document)) {
                reject(new Error('Invalid document'));
            }
            this.collection.insertOne(document, (err, result) => {
                if (err !== null) {
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    insertMany(documents) {
        return new Promise((resolve, reject) => {
            if (!this._validateDocuments(documents)) {
                reject(new Error('Invalid documents list'));
            }
            this.collection.insertMany(documents, (err, result) => {
                if (err !== null) {
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    count(query={}) {
        return new Promise((resolve, reject) => {
            this.collection.count(query, (err, count) => {
                if (err !== null) {
                    reject(err);
                }
                resolve(count);
            });
        });
    }

    findOne(query) {
        return new Promise((resolve, reject) => {
            this.collection.findOne(query, (err, doc) => {
                if (err !== null) {
                    reject(err);
                }
                resolve(doc);
            });
        });
    }

    find(query) {
        return new Promise((resolve, reject) => {
            this.collection.find(query).toArray((err, docs) => {
                if (err !== null) {
                    reject(err);
                }
                resolve(docs);
            });
        });
    }

    delete(filter) {
        return new Promise((resolve, reject) => {
            this.collection.deleteMany(filter, (err, result) => {
                if (err !== null) {
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    deleteAll() {
        return this.delete({});
    }

    close() {
        this.db.close();
        this.db = null;
        this.collection = null;
    }

    _validateDocument(document) {
        return typeof document == 'object' && document !== null;
    }

    _validateDocuments(documents) {
        return Array.isArray(documents) &&
               documents.reduce((r, d) => (r && this._validateDocument(d)), true);
    }

}

module.exports = Storage;