const _ = require('lodash');
const request = require('request');

class Client {

    constructor(config, workflow) {
        this.config = config;
        this.workflow = workflow;
        this.checkStatusInterval = 1000;
    }

    start() {
        let start = Date.now();
        this.log(`Starting`);
        this.asyncStart()
            .then(() => {
                let timeDiff = Date.now() - start;
                this.log(`Finished, time taken: ${timeDiff/1000} seconds`);
            })
            .catch((error) => {
                this.error(`Error occurred while starting`, error);
            })
    }

    async asyncStart() {
        this.log(`Submitting job`);
        let jobId = await this.submitJob();
        this.log(`Submitted job, job id: ${jobId}`);
        this.log(`Watching job status`);
        await this.watchJobStatus(jobId);
    }

    async submitJob() {
        let res = await this.requestMaster('POST', '/job', {workflow: this.workflow});
        return res.jobId;
    }

    watchJobStatus(jobId) {
        return new Promise((resolve, reject) => {
            let status = Client.MASTER_JOB_STATUSES.PENDING;
            let intervalId = 0;
            let checkStatusIteration = () => {
                this.checkJobStatus(jobId)
                    .then((newStatus) => {
                        if (status.id !== newStatus.id) {
                            status = newStatus;
                            this.log(`Job status: ${status.text}`);
                        }
                        if (status.id === Client.MASTER_JOB_STATUSES.DONE.id) {
                            if (intervalId) {
                                clearInterval(intervalId);
                            }
                            resolve(status);
                        }
                    })
                    .catch((error) => {
                        this.error('Request error', error);
                        if (intervalId) {
                            clearInterval(intervalId);
                        }
                        reject(status);
                    });
            };
            checkStatusIteration();
            intervalId = setInterval(checkStatusIteration, this.checkStatusInterval);
        });
    }

    async checkJobStatus(jobId) {
        let res = await this.requestMaster('GET', '/job/status', {jobId});
        return res.jobStatus;
    }

    requestMaster(method, requestPath, data=null) {
        method = method.toUpperCase();
        let url = this.config.masterNodeAddress + requestPath;
        return new Promise((resolve, reject) => {
            let params = {url, method, json: true};
            if (data !== null) {
                params = _.merge(params, method === 'GET' ? {qs: data} : {json: data});
            }
            request(params, (error, response, body) => {
                if (error) {
                    this.error('Request error', error);
                    reject(error);
                } else if (body.status !== 0) {
                    this.error('Request error, wrong status returned', body);
                    reject(new Error(`Request error, wrong status returned ${JSON.stringify(body)}`));
                }
                resolve(body);
            });
        });
    }

    log(...args) {
        console.log(`Client:`, ...args);
    }

    error(...args) {
        console.error(`Client:`, ...args);
    }

}

Client.MASTER_JOB_STATUSES = {
    PENDING:    {id: 0, text: 'Pending'},
    SUBMITTING: {id: 1, text: 'Submitting'},
    COLLECTING: {id: 2, text: 'Collecting urls'},
    FETCHING:   {id: 3, text: 'Fetching data'},
    DONE:       {id: 4, text: 'Done'}
};

module.exports = Client;