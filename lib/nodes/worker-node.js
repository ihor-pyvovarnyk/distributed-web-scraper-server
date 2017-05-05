const _ = require('lodash');
const socket = require('socket.io-client');

const AbstractNode = require('./abstract-node.js');
const WorkerJob = require('../jobs/worker-job.js');

class WorkerNode extends AbstractNode {

    constructor(config, port) {
        super(config, port);
        this.socket = null;
    }

    get masterAddress() {
        return this.config.masterNodeAddress;
    }

    start() {
        this.log(`Starting`);
        this.socket = socket(this.masterAddress);
        this.setupSocket();
    }

    setupSocket() {
        let socket = this.socket;
        socket.on('connect', () => {
            this.log(`Connected to master, socket id ${socket.id}`);
        });
        socket.on('job', (sentData) => {
            let {jobId, data} = sentData;
            let job = new WorkerJob(this, jobId, data.workflow);
            this.jobs.push(job);
            job.submit();
        });
        socket.on('job_collect', this._jobCommandEvent('job_collect'));
        socket.on('job_fetch', this._jobCommandEvent('job_fetch'));
        socket.on('disconnect', () => {
            this.error(`Socket to master disconnected, worker node is dead`);
            this.socket = null;
            // TODO: this.kill()
        });
    }

    _jobCommandEvent(event) {
        return (sentData) => {
            let jobId = sentData.jobId;
            let job = this.getJob(jobId);
            if (job === null) {
                this.error(`Emitted job command event for not existed job ${jobId}`)
            } else if (job.status === WorkerJob.STATUSES.DONE) {
                this.error(`Emitted job command event for finished job ${jobId}`)
            } else {
                job.receive(event, sentData.data);
            }
        };
    }

    getJob(jobId) {
        return _.first(this.jobs.filter(j => j.jobId == jobId)) || null;
    }

    jobEmit(job, event, data=null) {
        this.socket.emit(event, {jobId: job.jobId, data});
    }

    jobDone(job) {
        this.log(`Job ${job.jobId} has been finished`);
    }

    log(...args) {
        console.log('WorkerNode:', ...args);
    }

    error(...args) {
        console.error('WorkerNode:', ...args);
    }

}

module.exports = WorkerNode;