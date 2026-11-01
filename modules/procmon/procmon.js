const WebSocket = require('ws');
const os = require('os');
const POLL_INTERVAL_MS = 1500;

const ifaces = {
    winCPU : null,
    pslist : null,
}

const platform = os.platform();
if(platform == 'win32') {
    try {
        ifaces.winCPU = require("windows-cpu");
        if(!ifaces.winCPU.isSupported())
            ifaces.winCPU = null;
    }
    catch {
        ifaces.winCPU = null;
    }
}

// Pure-JS process listing on every platform (replaces the former native
// @aspectron/process-list addon, whose ABI rebuild against current NW.js
// is infeasible on a Python-3-only host). ps-list shells out to the
// platform's own ps / PowerShell - no native addon, no nw-gyp build.
try {
    ifaces.pslist = require('./ps-list');
} catch(ex) {
    ifaces.pslist = null;
    console.log('ps-list: not available', ex.toString());
}

class ProcessMonitor {
    constructor() {
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
        return new Promise((resolve) => {
            let data = {
                memory : {
                    total : os.totalmem(),
                    free : os.freemem()
                }
            }

            if(ifaces.winCPU) {
                ifaces.winCPU.totalLoad().then((results) =>{
                    let avg = results.reduce((m, n) => m + n, 0) / results.length;
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

    async procs() {
        if(!ifaces.pslist)
            return null;
        try {
            return await ifaces.pslist();
        } catch(ex) {
            console.log('ps-list error:', ex.toString());
            return null;
        }
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
        list = this.filter(list,'cmd');
        return list.map(({ pid, cmd, cpu, memory, pmem, vmem, threads}) => {
            return { pid, cmd, cpu, memory, pmem, vmem, threads };
        })
    }

    main() {

        this.poll();
    }

    async poll() {
        const system = await this.system();
        const procs = await this.procs();
        const snapshot = procs ? this.import_snapshot(procs) : undefined;
        const pslist = procs ? this.import_pslist(procs) : undefined;

        console.log('system', system ? 1 : 0, 'snapshot', snapshot?.length||0, 'pslist', pslist?.length||0);
        this.bbcast({system, snapshot, pslist});
        setTimeout(()=>{
            this.poll();
        }, POLL_INTERVAL_MS);
    }
}

// Entry point when spawned as a standalone process (`node procmon.js`),
// which is how lib/manager.js launches the monitor daemon.
if (require.main === module) {
    const monitor = new ProcessMonitor();
    monitor.main();
}