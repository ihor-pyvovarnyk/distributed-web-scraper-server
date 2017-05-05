const _ = require('lodash');

class MasterJob {

    constructor(node, jobId, workflow, sockets) {
        this.node = node;
        this.jobId = jobId;
        this.workflow = workflow;
        this.sockets = sockets;
        this.status = MasterJob.STATUSES.PENDING;
        this.waitingForWorkers = null;
    }

    getStatus() {
        return this.status;
    }

    submit() {
        this.status = MasterJob.STATUSES.SUBMITTING;
        this.log(`Submitting worker's jobs`);
        this.send('job', {workflow: this.workflow});
        this.waitingFor('job_ready', (dataSet) => this.onWorkersReady());
    }

    send(event, data=null) {
        this.node.jobEmit(this, event, data);
    }

    waitingFor(event, callback) {
        this.waitingForWorkers = {event, callback, received: []};
    }

    receive(socket, event, data) {
        let socketId = socket.id;
        if (this.waitingForWorkers === null) {
            this.error(`Doesn't expect any events now, received event ${event} from socket ${socketId}`);
        } else if (event !== this.waitingForWorkers.event) {
            this.error(`Doesn't expect now event ${event}, received from socket ${socketId}`);
        } else {
            let received = {socketId, data};
            this.waitingForWorkers.received.push(received);
            if (this.waitingForWorkers.received.length == this.sockets.length) {
                // All workers responded
                let dataSet = this.waitingForWorkers.received.map(r => r.data);
                let cb = this.waitingForWorkers.callback;
                this.waitingForWorkers = null;
                cb(dataSet);
            }
        }
    }

    onWorkersReady() { // Run Collect
        this.status = MasterJob.STATUSES.COLLECTING;
        this.log(`Workers ready, running collecting`);
        let step = this.sockets.length;
        this.send('job_collect', (socket, index) => ({localCollectorConfig: {offset: index, step}}));
        this.waitingFor('job_collect_ready', (dataSet) => this.onWorkersCollected(dataSet));
    }

    onWorkersCollected(dataSet) { // Run Fetch
        this.status = MasterJob.STATUSES.FETCHING;
        let urls = dataSet.map(d => d.urls).reduce((r, u) => r.concat(u), []);
        this.log(`Collected ${urls.length} urls, running fetching`);
        this.send('job_fetch');
        this.waitingFor('job_fetch_ready', (dataSet) => this.onWorkersFetched());
    }

    onWorkersFetched() { // DONE
        this.status = MasterJob.STATUSES.DONE;
        this.log(`Fetched, job has been finished`);
        this.done();
    }

    done() {
        this.log(`Job has been finished`);
        this.node.jobDone(this);
    }

    log(...args) {
        console.log(`MasterJob ${this.jobId}:`, ...args);
    }

    error(...args) {
        console.error(`MasterJob ${this.jobId}:`, ...args);
    }

}

MasterJob.STATUSES = {
    PENDING:    {id: 0, text: 'Pending'},
    SUBMITTING: {id: 1, text: 'Submitting'},
    COLLECTING: {id: 2, text: 'Collecting urls'},
    FETCHING:   {id: 3, text: 'Fetching data'},
    DONE:       {id: 4, text: 'Done'}
};

module.exports = MasterJob;