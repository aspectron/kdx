const os = require('os');
const child_process = require('child_process');

const utils = module.exports = {
	get platform() {
		let platform = os.platform();
		platform = ({ 'win32' : 'windows' }[platform]) || platform;
		let arch = os.arch();
		return `${platform}-${arch}`;
	}
 }

utils.spawn = (...args) => {
	return new Promise((resolve, reject) => {
		// if(this.core.flags.verbose && _.isArray(args[1]))
		// 	console.log("running:".bold,...args);

		let options = args[args.length-1] || { };
		let proc = child_process.spawn(...args);
		let done = false;

		if(options.stdout && typeof options.stdout == 'function')
		 	proc.stdout.on('data', options.stdout);

		proc.stdout.on('data', (data) => {
			process.stdout.write(data);
		});

		proc.stderr.on('data', (data) => {
			process.stderr.write(data);
		});

		proc.on('close', (code) => {
			if(!done) {
				resolve(code);
				done = true;
			}
		})

		proc.on('error', (err) => {
			if(!done) {
				done = true;
				reject(err);
			}
		})
	})
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

