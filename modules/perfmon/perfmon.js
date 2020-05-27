const _ = require('underscore');
const os = require('os');
const exec = require('child_process').exec;
const MonitorBase = require('../monitor-base');
const { snapshot } = require('process-list');

let winCPU = null;
if(os.platform() == 'win32') {
    try {
        winCPU = require("windows-cpu");
        if(!winCPU.isSupported())
            winCPU = null;
    }
    catch(ex) {
        winCPU = null;
    }
}

class SystemMonitor extends MonitorBase {
    constructor(manager, options) {
        super(manager, options);

        this.SNAPSHOT_CAPTURE_PROPERTIES = [
            //'name',
            //'ppid',
            //'path',
            // 'owner', <-- BREAKS on Windows
            // 'priority',
            'cmdline',
            //'starttime',
            'pid',
            'threads',
            'vmem',
            'pmem',
            'cpu',
            'utime',
            'stime'
        ];

        this.STATSD_POST_PROPERTIES = [
            'threads',
            'vmem',
            'pmem',
            'cpu',
            'utime',
            'stime'
        ];        
    }

    getSystemStats(callback) {
        let data = {
            memory : {
                total : os.totalmem(),
                free : os.freemem()
            }
        }

        if(winCPU) {
            winCPU.totalLoad().then((results) =>{
                let avg = _.reduce(results, function(m,n) { return m+n; }) / results.length;
                data.loadavg = {
                    '1m' : avg,
                    '5m' : avg,
                    '15m' : avg
                }

                next();
            },(err) => {
                console.log(('MONITOR system monitor error: '+err.toString()).red.bold);
                next();
            })
        }
        else {
            // console.log("USING GETAVERAGE".magenta.bold);
            let la = os.loadavg();
            data.loadavg = {
                '1m' : la[0],
                '5m' : la[1],
                '15m' : la[2]
            }
            next();
        }

        function next() {
            data.memory.used = data.memory.total - data.memory.free;
            callback(null, data);
        }
    }

    update() {
        this.getSystemStats(async (err, data) => {
            this.manager.gauge(this.name, data);
//console.log("SNAPSHOT 1");
//return;
    		let procs = null;
    		try {
    			procs = await snapshot(...this.SNAPSHOT_CAPTURE_PROPERTIES);
    		} catch(ex) { 
    			console.log(ex.toString());
    			return;
    		}

            if(procs)
                this.core.emit('SYSTEM.procs', procs);

            if(this.core.manager && this.core.manager.tasks) {
    //		console.log("SNAPSHOT 2");
                const pidMap = { };
                procs.forEach(p=>pidMap[p.pid]=p);
    //console.log("SNAPSHOT 3");

                // this.core.kstats.updateProcessList();

                let tasks = this.core.manager.tasks;
                tasks = tasks.filter(t=>t.proc&&t.proc.proc&&t.proc.proc.process&&t.proc.proc.process.pid);
                for(let task of tasks) {
                    let pid = task.proc.proc.process.pid;
                    if(pid && pidMap[pid]) {
                        const pinfo = pidMap[pid];
                        this.STATSD_POST_PROPERTIES.forEach((k) => {
                            //console.log(`proc.${k}`,parseFloat(pinfo[k]));
                            task.proc.gauge(`proc.${k}`,parseFloat(pinfo[k]));
                        })
                    }
                }
            }
        })
    }
}

module.exports = SystemMonitor;
