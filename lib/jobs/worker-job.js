const _ = require('lodash');

const UrlCollector = require('./../stages/url-collector.js');
const DataFetcher = require('./../stages/data-fetcher.js');

class WorkerJob {

    constructor(node, jobId, workflow) {
        this.node = node;
        this.jobId = jobId;
        this.workflow = workflow;
        this.status = WorkerJob.STATUSES.PENDING;
        this.waitingForMaster = null;
        this.collectedUrls = [];
    }

    getStatus() {
        return this.status;
    }

    submit() {
        this.status = WorkerJob.STATUSES.SUBMITTING;
        this.log(`Submitting worker job`);
        this.send('job_ready');
        this.waitingFor('job_collect', (data) => this.collect(data));
    }

    send(event, data=null) {
        this.node.jobEmit(this, event, data);
    }

    waitingFor(event, callback) {
        // will be a problem if events such as `status` will be implemented
        this.waitingForMaster = {event, callback};
    }

    receive(event, data) {
        if (this.waitingForMaster === null) {
            this.error(`Doesn't expect any events now, received event ${event} from master`);
        } else if (event !== this.waitingForMaster.event) {
            this.error(`Doesn't expect now event ${event}, received from master`);
        } else {
            this.waitingForMaster.callback(data);
            this.waitingForMaster = null;
        }
    }

    collect(data) {
        this.status = WorkerJob.STATUSES.COLLECTING;
        this.log(`Started collecting`);
        let collectorConfig = _.merge(data.localCollectorConfig, this.workflow.urlCollector);
        let collector = new UrlCollector(collectorConfig);
        collector.collect()
            .then((urls) => {
                this.log(`Finished collecting`);
                this.collectedUrls = urls;
                this.send('job_collect_ready', {urls});
                this.waitingFor('job_fetch', (data) => this.fetch());
            })
            .catch((error) => {
                this.error(`Collecting error`, error);
            });
    }

    fetch() {
        this.status = WorkerJob.STATUSES.FETCHING;
        this.log(`Started fetching`);
        let fetcher = new DataFetcher(this.workflow.dataFetcher);
        fetcher.fetch(this.collectedUrls)
            .then(() => {
                this.log(`Finished fetching`);
                this.send('job_fetch_ready');
                this.done();
            })
            .catch((error) => {
                this.error(`Fetching error`, error);
            });
    }

    done() {
        this.status = WorkerJob.STATUSES.DONE;
        this.collectedUrls = [];
        this.log(`Job has been finished`);
        this.node.jobDone(this);
    }

    log(...args) {
        console.log(`WorkerJob ${this.jobId}:`, ...args);
    }

    error(...args) {
        console.error(`WorkerJob ${this.jobId}:`, ...args);
    }

}

WorkerJob.STATUSES = {
    PENDING:    {id: 0, text: 'Pending'},
    SUBMITTING: {id: 1, text: 'Submitting'},
    COLLECTING: {id: 2, text: 'Collecting urls'},
    FETCHING:   {id: 3, text: 'Fetching data'},
    DONE:       {id: 4, text: 'Done'}
};

module.exports = WorkerJob;