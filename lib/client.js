const argv = require('yargs').argv;
const request = require('request');
const scraperConfig = require('../scraper.json');

class Client {

    run() {
        var masterAddress = scraperConfig.masterServerNode;
        request(masterAddress + '/master', (error, response, body) => {
            if (error) {
                console.log("Cannot init master node")
            }
            let data = JSON.parse(body);
            if (data.status == 0) {
                console.log("Success master run", data);
                checkState();
            } else {
                console.log("Failed master run", data);
            }
        });

        function checkState() {
            let intervalId = setInterval(() => {
                request(masterAddress + '/master/state', (error, response, body) => {
                    if (error) {
                        console.log("Cannot get master node state")
                    }
                    let data = JSON.parse(body);
                    if (data.status == 0) {
                        if (!data.running) {
                            clearInterval(intervalId);
                            console.log("Master node finished successfully.")
                        }
                    } else {
                        console.log("Failed getting master node state", data);
                    }
                });
            }, 1000);
        }
    }

}

var client = new Client();
client.run();