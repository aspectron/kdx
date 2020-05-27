const os = require('os');
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

class ProcessMonitor {
    constructor() {
        
        this.SNAPSHOT_CAPTURE_PROPERTIES = [
            //'name',
            //'ppid',
            //'path',
            // 'owner', <-- BREAKS on Windows
            // 'priority',
            //'starttime',
            // ---------------
            //'cmdline',
            'pid',
            'threads',
            'vmem',
            'pmem',
            'cpu',
            'utime',
            'stime'
        ];

        // this.STATSD_POST_PROPERTIES = [
        //     'threads',
        //     'vmem',
        //     'pmem',
        //     'cpu',
        //     'utime',
        //     'stime'
        // ];        
    }

    system() {
        return new Promise((resolve,reject) => {
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
                resolve(data);
            }
        })
    }

    procs() {
        return new Promise((resolve) => {
    		let procs = null;
    		try {
                procs = await snapshot(...this.SNAPSHOT_CAPTURE_PROPERTIES);
                resolve(procs);
    		} catch(ex) { 
    			console.log(ex.toString());
    			resolve();
    		}
        })
    }

    main() {

        this.poll();
    }

    async poll() {

        const system = await this.system();
        const procs = await this.procs();
console.log(system,procs);
        setInterval(()=>{
            this.poll();
        },1e4)
    }
}

const monitor = new ProcessMonitor();
monitor.main();