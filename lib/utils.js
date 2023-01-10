const path = require('path');
const os = require('os');
const child_process = require('child_process');
const PTY = null;
//const PTY = require('node-pty');

const utils = module.exports = {
	get platform() {
		let platform = os.platform();
		platform = ({ 'win32' : 'windows', darwin: 'macos' }[platform]) || platform;
		let arch = os.arch();
		return `${platform}-${arch}`;
	},
	get platform_name() {
		let platform = os.platform();
		return ({ 'win32' : 'windows', darwin: 'macos' }[platform]) || platform;
	}
 }

utils.spawn = (file, args, options = { }, terminal = null) => {
	return new Promise((resolve, reject) => {

		let { env } = process;

		const usePTY = false; // !!PTY;
		const filter = typeof options.stdout == 'function';

//		const 

		if(!usePTY) {
			// console.log("TERMINAL:",terminal);
			if(terminal) {
				args.unshift(file);
				args.unshift('pty.js');
				file = path.join(options.cwd,'node');
				if(process.platform == 'win32')
					file += '.exe';

				env = Object.assign({}, env, {
					ROWS : terminal.term.rows,
					COLS : terminal.term.cols
				});
			}


			let proc = child_process.spawn(file,args,Object.assign({ env, stdio: 'pipe' }, options));
	//		let proc = child_process.spawn(file,args,Object.assign({ env, stdio: 'pipe' }, options));
	//		let proc = child_process.spawn(file,args,Object.assign({ env, stdio: 'pipe' }, options));
			let done = false;


			proc.stdin?.setEncoding('utf-8');

			proc.stdout?.on?.('data', (data) => {
				if(filter)
					data = options.stdout(data);
				if(data)
					process.stdout.write(data);
			});

			proc.stderr?.on?.('data', (data) => {
				if(filter)
					data = options.stdout(data);
				if(data)
					process.stderr.write(data);
			});

			if(terminal && proc.stdin) {
				terminal.captureStdin((args) => {
					proc.stdin.write(args.termKey);
				});
			}

			const releaseStdin = ()=>{
				if(terminal && proc.stdin) {
					terminal.releaseStdin();
				}
			}

			proc.on('close', (code) => {
				if(!done) {
					releaseStdin();
					resolve(code);
					done = true;
				}
			})

			proc.on('error', (err) => {
				if(!done) {
					releaseStdin();
					done = true;
					reject(err);
				}
			})
		}
		else {

			let proc = PTY.spawn(file, args, Object.assign({
//				cwd,
//				cols,
//				rows,
				stdio : 'pipe'
				//	detached : true
			}, { /* options ? */ }));

			proc.onData((data) => {
				if(filter)
					options.stdout(data);
				//this.session_stream_(session, data, 1);
			})

			if(terminal) {
				terminal.captureStdin((args) => {
					proc.write(args.termKey);
				});
			}

			const releaseStdin = ()=>{
				if(terminal) {
					terminal.releaseStdin();
				}
			}

			proc.onExit((code, signal) => {
				releaseStdin();
				resolve(code);
			})
		}
	})
}

utils.match = (text, regexp) => {
    return ((text && text.match(regexp) || {}).groups || {});
}

utils.args = (args) => {
    args = args || process.argv.slice(2);

    let argsRegex = null;
    try {
        argsRegex = new RegExp('^--(?<prop>[\\w-]+)(=(?<value>.+))?$');
    } catch(ex) { /*console.log(ex);*/ }

    let o = { }

    if(!argsRegex) {

        args.forEach((arg)=>{
            arg = arg.split('=');
            let k = arg.shift();
            let v = arg.shift();
            k = k.replace(/^--/,'');
            if(v !== undefined) o[k] = v; else o[k] = true;
        });

        return o;
    }


    args.map((arg) => {
        const { prop, value } = utils.match(arg,argsRegex);

        if(value == undefined)
            o[prop] = true;
        else
        if(o[prop]) {
            if(Array.isArray(o[prop]))
                o[prop].push(value);
            else
                o[prop] = [o[prop], value];
        }
        else {
            o[prop] = value;
        }
    })
    return o;
}

if(!Number.prototype.toFileSize) {
  Object.defineProperty(Number.prototype, 'toFileSize', {
     value: function(a, asNumber){
         var b,c,d;
         var r = (
             a=a?[1e3,'k','B']:[1024,'K','iB'],
             b=Math,
             c=b.log,
             d=c(this)/c(a[0])|0,this/b.pow(a[0],d)
         ).toFixed(2)

         if(!asNumber){
             r += ' '+(d?(a[1]+'MGTPEZY')[--d]+a[2]:'Bytes');
         }
         return r;
     },
     writable:false,
     enumerable:false
  });
}

if(!Number.prototype.toCS) {
	Object.defineProperty(Number.prototype, 'toCS', {
	   value: function(p, tz){

			let precision = p || 0;
		
			let f = (this).toFixed(precision).split('.');
		
			f[0] = f[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			let t = f.join('.');
			
			//console.log("result:",t);

			if(!tz || !~t.indexOf('.'))
				return t;
		
			while(t.length > 2 && t[t.length-1] == 0 && t[t.length-2] != '.')
				t = t.substring(0, t.length-1);



			return t;

		},
		writable:false,
		enumerable:false
	});
}
