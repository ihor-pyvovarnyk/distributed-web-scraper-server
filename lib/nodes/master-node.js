const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const socket = require('socket.io');
const _ = require('lodash');
const uuid = require('uuid/v4');

const AbstractNode = require('./abstract-node.js');
const MasterJob = require('../jobs/master-job.js');

class MasterNode extends AbstractNode {

    constructor(config, port) {
        super(config, port);
        this.httpServer = null;
        this.expressApp = null;
        this.socketServer = null;
        this.sockets = [];
    }

    start() {
        this.expressApp = express();
        this.httpServer = http.createServer(this.expressApp);
        this.socketServer = socket(this.httpServer);
        this.setupExpressServer();
        this.setupSocketServer();
        this.httpServer.listen(this.port);
        this.log(`Listening port ${this.port}`);
    }

    setupExpressServer() {
        let app = this.expressApp;
        app.use(bodyParser.json());
        app.get('/', (req, res) => {
            // Up and running
            res.json({status: 0});
        });
        app.post('/job', (req, res) => {
            let {workflow} = req.body;
            let activeSockets = _.clone(this.sockets);
            let job = new MasterJob(this, uuid(), workflow, activeSockets);
            this.jobs.push(job);
            job.submit();
            res.json({status: 0, jobId: job.jobId});
        });
        app.get('/job/status', (req, res) => {
            let job = this.getJob(req.query.jobId);
            res.json({status: 0, jobId: job.jobId, jobStatus: job.getStatus()})
        });
    }

    setupSocketServer() {
        this.socketServer.on('connection', (socket) => this.setupSocket(socket));
    }

    setupSocket(socket) {
        this.log(`Received connection, socket id ${socket.id}`);
        this.sockets.push(socket);
        socket.on('job_ready', this._jobStatusEvent('job_ready', socket));
        socket.on('job_collect_ready', this._jobStatusEvent('job_collect_ready', socket));
        socket.on('job_fetch_ready', this._jobStatusEvent('job_fetch_ready', socket));
        socket.on('disconnect', () => {
            // If any job is running, it will stuck on certain stage
            this.log(`Socket id ${socket.id} disconnected`);
            _.remove(this.sockets, s => s.id == socket.id);
        });
    }

    _jobStatusEvent(event, socket) {
        return (sentData) => {
            let jobId = sentData.jobId;
            let socketId = socket.id;
            let job = this.getJob(jobId);
            if (job === null) {
                this.error(`Emitted job status event for not existed job ${jobId} from socket ${socketId}`)
            } else if (job.status === MasterJob.STATUSES.DONE) {
                this.error(`Emitted job status event for finished job ${jobId} from socket ${socketId}`)
            } else {
                job.receive(socket, event, sentData.data);
            }
        };
    }

    getJob(jobId) {
        return _.first(this.jobs.filter(j => j.jobId == jobId)) || null;
    }

    jobEmit(job, event, data=null) {
        if (typeof data === 'function') {
            job.sockets.map((s, i) => s.emit(event, {jobId: job.jobId, data: data(s, i)}));
        } else {
            job.sockets.map(s => s.emit(event, {jobId: job.jobId, data}));
        }
    }

    jobDone(job) {
        this.log(`Job ${job.jobId} has been finished`);
    }

    emit(event, ...args) {
        this.sockets.map(s => s.emit(event, ...args));
    }

    log(...args) {
        console.log('MasterNode:', ...args);
    }

    error(...args) {
        console.error('MasterNode:', ...args);
    }

}

module.exports = MasterNode;