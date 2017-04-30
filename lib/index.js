const argv = require('yargs').argv;
const ServerNode = require('./server-node.js');
const MasterNode = require('./master-node.js');

const express = require('express');
const app = express();

const scraperConfig = require('../scraper.json');
var node = null;

// TODO: Use sockets to communicate between nodes

app.get('/master', (req, res) => {
    try {
        node = new MasterNode();
        node.run();
        console.log("MASTER INIT SUCCESS");
        res.send(JSON.stringify({status: 0}));
    } catch (error) {
        console.log("MASTER INIT FAIL");
        res.send(JSON.stringify({status: 1, error}));
    }
});

app.get('/master/state', (req, res) => {
    try {
        res.send(JSON.stringify({status: 0, running: node.isRunning}));
    } catch (error) {
        console.log("MASTER STATUS FAIL");
        res.send(JSON.stringify({status: 1, error}));
    }
});

app.get('/node', (req, res) => {
    try {
        node = new ServerNode();
        console.log("NODE INIT SUCCESS");
        res.send(JSON.stringify({status: 0}));
    } catch (error) {
        console.log("NODE INIT FAIL");
        res.send(JSON.stringify({status: 1, error}));
    }
});

app.get('/collect', (req, res) => {
    let startFrom = parseInt(req.query.startFrom) || 1;
    let pagesIncrementer = parseInt(req.query.increment) || scraperConfig.scraperServerNodes.length || 1;
    node.collect(scraperConfig.collectorUrl, startFrom, pagesIncrementer)
        .then((urls) => {
            res.send(JSON.stringify({status: 0, urls}));
        })
        .catch((error) => {
            res.send(JSON.stringify({status: 1, error}));
        })
});

app.get('/scrap', (req, res) => {
    let bulkSize = parseInt(req.query.bulkSize) || 10;
    let allUrls = req.query.urls.split(',');
    if (allUrls.length == 1 && allUrls[0] == '') {
        allUrls = [];
    }
    console.log("All urls to scrap", allUrls);
    async function bulkScrap() {
        try {
            let allData = [];
            for (let i = 0; i < allUrls.length; i += bulkSize) {
                let urls = allUrls.slice(i, i + bulkSize);
                let data = await node.scrap(urls);
                await saveBulkData(data);
            }
            return allData;
        } catch (error) {
            console.log("bulk scrap error", error);
        }
    }
    async function saveBulkData(data) {
        try {
            await node.store(data);
            console.log("Saved bulk data")
        } catch (error) {
            console.log('Save data error', error)
        }
    }
    try {
        bulkScrap()
            .then((data) => {
                res.send(JSON.stringify({status: 0}));
            })
            .catch((error) => {
                res.send(JSON.stringify({status: 1, error}));
            });
    } catch (error) {
        res.send(JSON.stringify({status: 1, error}));
    }
});

app.listen(argv.port);
console.log("Listen port", argv.port);

