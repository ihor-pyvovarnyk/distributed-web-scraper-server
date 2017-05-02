const assert = require('assert');
const Storage = require('../lib/base/storage.js');

const testCollectionName = 'testCollection';
const storageConfig = {
    host: 'localhost',
    port: '27017',
    dbName: 'web-scrapper'
};

describe('Storage class', function() {

    it('should create Storage object', () => {
        let storage = new Storage(storageConfig);
        assert(storage instanceof Storage);
    });

    it('should connect to database, delete all documents and close connection', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                await storage.deleteAll();
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

    it('should throw error if trying to insert invalid document', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                await storage.insertOne(null);
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done(new Error('Inserted invalid document'));
            })
            .catch((error) => {
                done();
            });
    });

    it('should insert one document using insertOne method', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                let results = await storage.insertOne({insertOneValue: 1, otherProp: 1});
                if (results.insertedCount !== 1) {
                    throw new Error('Wrong number of inserted elements observed');
                }
                if (!results.insertedId) {
                    throw new Error('No inserted id found, found value ${results.insertedId}');
                }
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

    it('should insert two documents using insertMany method', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                let docs = [
                    {insertManyValue: 1, otherProp: 1},
                    {insertManyValue: 2, otherProp: 2}
                ];
                let results = await storage.insertMany(docs);
                if (results.insertedCount !== docs.length) {
                    throw new Error(`Wrong number of inserted documents ${results.insertedCount} should be ${docs.length}`);
                }
                if (results.insertedIds.length !== docs.length) {
                    throw new Error('Wrong number of inserted ids');
                }
                if (!results.insertedIds.reduce((r, i) => r && i, true)) {
                    throw new Error(`Not all inserted ids are valid: ${results.insertedIds.join(', ')}`);
                }
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

    it('should show right count of documents in collection after insertions', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                let count = await storage.count();
                if (count !== 3) {
                    throw new Error('Got wrong number of documents in collection');
                }
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

    it('should show right count of documents in collection after insertions by filter', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                let count = await storage.count({insertManyValue: {$exists: true}});
                if (count !== 2) {
                    throw new Error('Got wrong number of documents in collection by filter');
                }
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

    it('should find one document with otherProp field equal to 1', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                let doc = await storage.findOne({otherProp: 1});
                if (doc.otherProp !== 1) {
                    throw new Error('Wrong document found by findOne method');
                }
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

    it('should find all documents with otherProp field equal to 1', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                let docs = await storage.find({otherProp: 1});
                if (docs.length !== 2) {
                    throw new Error('Wrong number of documents found by find method');
                }
                if (!docs.reduce((r, d) => r && d.otherProp === 1, true)) {
                    throw new Error(`find method filter doesn\'t work, documents: ${JSON.stringify(docs)}`);
                }
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

    it('should delete all document with otherProp field equal to 1', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                let results = await storage.delete({otherProp: 1});
                if (results.deletedCount !== 2) {
                    throw new Error('Wrong number of documents were deleted');
                }
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

    it('should show right count of documents after deletion', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                let count = await storage.count();
                if (count !== 1) {
                    throw new Error('Got wrong number of documents in collection after deletion');
                }
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

    it('should delete all documents and check count', (done) => {
        async function asyncAction() {
            let storage = new Storage(storageConfig);
            try {
                await storage.connect();
                storage.setCollection(testCollectionName);
                await storage.deleteAll();
                let count = await storage.count();
                if (count !== 0) {
                    throw new Error ('Didn\'t delete all documents')
                }
            } finally {
                storage.close();
            }
        }
        asyncAction()
            .then(() => {
                done();
            })
            .catch(done);
    });

});
