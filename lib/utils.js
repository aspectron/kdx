const child_process = require('child_process');

const utils = module.exports = { }

utils.spawn = (...args) => {
	return new Promise((resolve, reject) => {
		// if(this.core.flags.verbose && _.isArray(args[1]))
		// 	console.log("running:".bold,...args);

		let options = args[args.length-1] || { };
		let proc = child_process.spawn(...args);
		let done = false;

		// if(options.stdout && typeof options.stdout == 'function')
		// 	proc.stdout.on('data', options.stdout);
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
