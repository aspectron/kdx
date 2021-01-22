const WebSocket = require('ws');
const os = require('os');
const ifaces = {
    winCPU : null,
    snapshot : null,
    pslist : null,
}

const platform = os.platform();
if(platform == 'win32') {
    try {
        ifaces.winCPU = require("windows-cpu");
        if(!ifaces.winCPU.isSupported())
            ifaces.winCPU = null;
    }
    catch(ex) {
        ifaces.winCPU = null;
    }
}

try {
    ifaces.snapshot = require('@aspectron/process-list').snapshot;
} catch(ex) {
    ifaces.snapshot = null;
    console.log('snapshot: not available')
}

if(platform == 'darwin') {
    try {
        ifaces.pslist = require('./ps-list');
    } catch(ex) {
        ifaces.pslist = null;
        console.log('pslist: not available')
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
            'cmdline',
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

        this.websockets = [];
        this.wss = new WebSocket.Server({ port: 9119 });
        let sid_ = 0;
        this.wss.on('connection', (ws) => {
            const sid = sid_++;
            this.websockets.push({sid,ws});
            console.log(`websocket connection ${sid}`);
            // ws.on('message', (message) => {
            //     console.log('received: %s', message);
            // });

            // ws.send('something');
            // });

            ws.on('close', () => {
                console.log("disconnected");
                this.websockets = this.websockets.filter(ws => ws.sid != sid);
            })
        })
    }

    bbcast(json) {
        if(typeof json != 'string')
            json = JSON.stringify(json);
        this.websockets.forEach((client) => {
            if(client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(json);
            }
        })
    }
    
    system() {
        return new Promise((resolve,reject) => {
            let data = {
                memory : {
                    total : os.totalmem(),
                    free : os.freemem()
                }
            }

            if(ifaces.winCPU) {
                ifaces.winCPU.totalLoad().then((results) =>{
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

    snapshot() {
        if(!ifaces.snapshot)
            return Promise.resolve();
        return new Promise(async (resolve) => {
    		let procs = undefined;
    		try {
                procs = await ifaces.snapshot(...this.SNAPSHOT_CAPTURE_PROPERTIES);
                //console.log("procs:",procs.map(p=>p.cmdline).join('\n'));
                console.log("procs:",procs);//.map(p=>p.cmdline).join('\n'));

                procs = this.import_snapshot(procs);
    		} catch(ex) { 
                console.log(ex.toString());
    		}
            resolve(procs);
        })
    }

    async pslist() {
        if(!ifaces.pslist)
            return Promise.resolve();
        let list = await ifaces.pslist();
        return this.import_pslist(list);
    }
    
    filter(list, prop) {
        list = list.filter(proc => {
            let t = proc[prop];
            return /kaspa|postgres|mosquitto|dag|perfmon/ig.test(t);
        })
        return list;
    }

    import_pslist(list) {
        list = this.filter(list,'cmd');
        return list.map(({ pid, cmd, memory, cpu}) => {
            return { pid, cmd, memory, cpu };
        })
    }

    import_snapshot(list) {
        list = this.filter(list,'cmdline');
        return list.map(({ pid, cmdline, pmem, vmem, threads, cpu}) => {
            pmem = parseInt(pmem) || 0;
            vmem = parseInt(vmem) || 0;
            return { pid, cmd : cmdline, pmem, vmem, cpu };
        })
    }

    main() {

        this.poll();
    }

    async poll() {

        let ts = Date.now();
        //console.log('poll',ts);

        const system = await this.system();
        const snapshot = await this.snapshot();
        const pslist = await this.pslist();

        console.log('system',system?.length||0,'snapshot',snapshot?.length||0,'pslist',pslist?.length||0);
        //console.log(system,snapshot,pslist);
        //console.log(pslist.filter(v=>v.memory > 0))
        this.bbcast({system, snapshot, pslist});
        //console.log(`duration: ${Date.now()-ts} msec`);
        setTimeout(()=>{
            this.poll();
        },1.5*1e3);
    }
}

//const monitor = new ProcessMonitor();
//monitor.main();