
let extract_; try { extract_ = require('extract-zip'); } catch(ex) { showDepsError() }; const extract = extract_;
const os = require('os');
const fs = require('fs');
const path = require('path');
const utils = require('../lib/utils');
const pkg = require('./package');
const fse = require('fs-extra');
const mkdirp = require('mkdirp');
const progress = require('request-progress');
const request = require('request');
const colors = require('colors');
const ansi = require('ansi-escapes');

const GO_VERSION_DEFAULT = 'go1.14.2';

class Build {
    constructor() {
        this.args = utils.args();

        this.PLATFORM = {'win32':'windows'}[os.platform()] || os.platform();
        this.PLATFORM_ARCH = `${this.PLATFORM}-${os.arch()}`;
        this.PLATFORM_BINARY_EXTENSION = this.PLATFORM == 'windows' ? '.exe' : '';
        this.PATH_SEPARATOR = this.PLATFORM == 'windows' ? ';' : ':';
        if(this.args.folder)
            this.FOLDER = this.args.folder;
        else
            this.FOLDER = path.join(os.homedir(),'.kdx','build');
        //this.FOLDER = path.join(__dirname,this.args['folder'] || '.build');
        this.CACHE = path.join(this.FOLDER,'cache');
        this.TOOLS = path.join(this.FOLDER,'tools');
        this.BUILD = path.join(this.FOLDER,'build');
        this.BIN = path.join(os.homedir(),'.kdx','bin',this.PLATFORM_ARCH);
        [this.CACHE,this.TOOLS,this.BUILD,this.BIN].forEach(f=>mkdirp.sync(f));

        if(this.PLATFORM == 'windows')
            this.addToPath('c:/tdm-gcc-64/bin');
    }

    help() {
        const text = 
`KDX builder ${pkg.version}
Usage: build <flags>
Where <flags> are:
    go  : go version in 'go1.14.2' format:  --go=go1.14.2
`;
        console.log(text);

        return Promise.resolve();
    }

    async main() {
        try {
            if(this.args.help)
                return this.help();

            this.log(`KDX builder ${pkg.version}`);
            await this.preflight();
            await this.build();

        } catch(ex) {
            this.log(ex);
        }
    }

    async preflight() {
        try {
            this.log("Preflight check...");
            
            process.env.PATH = process.env.PATH.split(this.PATH_SEPARATOR).filter((p) => {
                return !/msys/i.test(p);
            }).join(this.PATH_SEPARATOR);

            this.GIT_BIN = 'git'+this.PLATFORM_BINARY_EXTENSION;

            if(this.PLATFORM == 'windows') {
                const url = `https://github.com/git-for-windows/git/releases/download/v2.26.2.windows.1/MinGit-2.26.2-64-bit.zip`;
                const file = path.join(this.CACHE, path.basename(url));
                const folder = path.join(this.TOOLS, path.basename(url).replace(/\.zip/i,''));
                try {
                    if(fs.existsSync(folder))
                        this.GIT_BIN = path.join(folder,'cmd','git.exe');
                    let git = (await this.exec(this.GIT_BIN,['version'])).split('\n').shift();
                    this.log(git)
                } catch(ex) {
                    if(ex.code == 'ENOENT') {
                        await this.download(url, file);
                        await this.extract(file, folder);
                        this.GIT_BIN = path.join(folder,'cmd','git.exe');
                        // this.addToPath(path.join(folder,'mingw64','bin'));
                        let git = (await this.exec(this.GIT_BIN,['version'])).split('\n').shift();
                        this.log(git);
                    } else
                        throw ex;
                }
            } else {
                let git = (await this.exec('git',['version'])).split('\n').shift();
                this.log(git)
            }

            if(this.PLATFORM == 'windows') {

                this.GCC_VERSION = 'gcc-9.2.0-tdm64-1' || this.args.gcc;
                const GCC_FOLDER = path.join(this.TOOLS,this.GCC_VERSION);
                this.addToPath(path.join(GCC_FOLDER,'bin'));
                this.GCC = path.join(GCC_FOLDER,'bin/gcc.exe');

                try {
                    if(!fs.existsSync(path.join(GCC_FOLDER, 'bin/gcc'+this.PLATFORM_BINARY_EXTENSION)))
                        throw { code : 'ENOENT', 'reason' : 'gcc binary missing' };
                    let gcc = (await this.exec(this.GCC,['--version'])).split('\n').shift();
                    this.log(gcc)
                    if(!/tdm64/.test(gcc))
                        throw { code : 'NOENT', reason : 'tdm compiler not detected' };
                } catch(ex) {
                    if(ex.code == 'ENOENT') {
                        let urls = [];
                        if(/tdm64/i.test(this.GCC_VERSION)) {
                            urls.push(`https://github.com/jmeubank/tdm-gcc-src/releases/download/v9.2.0-tdm64-1/gcc-9.2.0-tdm64-1-core.zip`);
                            urls.push(`https://github.com/jmeubank/tdm-binutils-gdb/releases/download/v2.33.1-tdm64-1/binutils-2.33.1-tdm64-1.zip`);
                            urls.push(`https://github.com/jmeubank/mingw-w64/releases/download/v7-git20191109-gcc9-tdm64-1/mingw64runtime-v7-git20191109-gcc9-tdm64-1.zip`);
                            urls.push(`https://github.com/jmeubank/windows-default-manifest/releases/download/v6.4-x86_64_multi/windows-default-manifest-6.4-x86_64_multi.zip`);
                        }
                        else
                            throw `Unknown gcc compiler type ${this.GCC_VERSION}`;

                        if(fs.existsSync(GCC_FOLDER))
                            fse.emptyDirSync(GCC_FOLDER);

                        while(urls.length) {
                            let url = urls.shift();
                            let file = path.join(this.CACHE, path.basename(url));
                            await this.download(url, file);
                            await this.extract(file, GCC_FOLDER);
                        }
                    }
                    else
                        throw ex;
                }
            } else {
                this.GCC = 'gcc';
                let gcc = (await this.exec(this.GCC,['--version'])).split('\n').shift();
                this.log(gcc);
            }

            const GO_VERSION = this.args.go || GO_VERSION_DEFAULT;
            try {
                if(this.PLATFORM == 'windows')
                    this.GOBIN = path.join(this.TOOLS,GO_VERSION,'bin','go'+this.PLATFORM_BINARY_EXTENSION);
                else
                    this.GOBIN = 'go';
                let go = (await this.exec(this.GOBIN,['version'])).split('\n').shift();
                this.log(go);
            } catch(ex) {
                if(ex.code == "ENOENT") {
                    this.log('unable to run go!');
                    this.log('attempting install...');
                    const ARCHIVE_EXTENSION = this.PLATFORM == 'windows' ? 'zip' : 'tar.gz'

                    //const folder = this.TOO//path.join(this.TOOLS,
                    let url = `https://dl.google.com/go/${GO_VERSION}.${this.PLATFORM}-amd64.${ARCHIVE_EXTENSION}`;
                    let file = path.join(this.CACHE,`${GO_VERSION}.${ARCHIVE_EXTENSION}`);
                    let folder = path.join(this.CACHE,`go/${GO_VERSION}`);
                    mkdirp.sync(folder);
                    //this.log(`downloading: ${file}`);
                    await this.download(url,file);
                    //this.log(`unzipping to: ${folder}`);
                    await this.extract(file,folder);
                    console.log("extraction done...");
                    fs.renameSync(path.join(folder,'go'),path.join(this.TOOLS,GO_VERSION));

                    let go = (await this.exec(this.GOBIN,['version'])).split('\n').shift();
                    this.log(go);
                }
                else {
                    // console.log(ex);
                    // console.log(JSON.stringify(ex,null,'\t'));
                    throw ex;
                }
            }

        } catch(ex) {
            if(ex.path && ex.code == "ENOENT")
                throw new Error(`...it seems there is an issue running ${ex.path}`);
            else
                throw ex;
        }
    }

    async build() {
        try {
            this.log('Build starting...');
            this.log('Syncing repos...');

            this.TOOLS = path.join(this.FOLDER,'tools');
            // this has migrated to ~/.kdx/bin 
            // this.BIN = path.join(__dirname,`../bin/${this.PLATFORM_ARCH}/`);
            //
            this.BUILD = path.join(this.FOLDER,'build');
            this.GOPATH = path.join(this.BUILD,'go');
            this.GOSRC = path.join(this.GOPATH,'src');
            mkdirp.sync(path.join(this.GOSRC,'github.com'));
            const dest = path.join(this.GOSRC,'github.com/kaspanet/');
            if(this.args.reset && fs.existsSync(dest))
                fse.emptyDirSync(dest);
        
            const branch = this.args['branch'] || 'master';
        
            const repos = { };
            repos.kaspa = ['kaspad','kasparov'];
        
            for(const repo of repos.kaspa) {
                this.log(`git clone git@github.com:kaspanet/${repo}`);
                await this.clone(`git@github.com:kaspanet/${repo}`, dest, {branch});
            }
            
            if(this.args['with-extras']) {
                repos.extras = ['miningsimulator', 'txgen'];
                for(const repo of repos.extras) {
                    this.log(`git clone git@github.com:kaspanet/${repo}`);
                    await this.clone(`git@github.com:kaspanet/${repo}`, dest);
                }
            }
        
            // ---
            let targets = [
                'kaspad',
                'kasparov/kasparovd',
                'kasparov/kasparovsyncd',
                'kasparov/examples/wallet',
                ...fs.readdirSync(path.join(dest,'kaspad/cmd')).map(f => `kaspad/cmd/${f}`)
            ];
        
            if(this.args['with-extras']) {
                targets = [
                    ...targets,
                    // 'miningsimulator',
                    'txgen',                    
                ];
            }
        
            let rename = { }
            let folders = []
            for(let target of targets) {
                let folder = path.join(dest,target);
                this.log('building', folder);
                await this.spawn(this.GOBIN,['build'], { cwd : folder, stdio : 'inherit' });
                folders.push(folder);
            }
        
            folders.forEach((folder) => {
                let file = path.basename(folder);
                let dest = rename[file] || file;
                file += this.PLATFORM_BINARY_EXTENSION;
                dest += this.PLATFORM_BINARY_EXTENSION;
        
                if(!fs.existsSync(path.join(folder,file))) {
                    this.log(`Unable to locate source file: ${path.join(folder,file)}`);
                    this.log(`...giving up`);
                    process.exit(1);
                }
        
                fse.copy(path.join(folder,file),path.join(this.BIN,dest));
            })
        
            fse.copy(path.join(dest,'kasparov','database','migrations'),path.join(this.BIN,'database','migrations'));

        } catch(ex) {
            throw ex;
        }
    }

    addToPath(p_) {
        let p = process.env.PATH.split(this.PATH_SEPARATOR);
        p.unshift(p_);
        process.env.PATH = [...new Set(p)].join(this.PATH_SEPARATOR);
    }

    version() {
        this.log(pkg.version);
    }

    log(...args) {
        console.log(`[${(new Date()).toString().substring(16,24)}]`,...args);
    }

    exec(file, args, options = { }) {
        return new Promise((resolve, reject) => {
            let text = '';
            this.spawn(file, args, Object.assign({
                stdout : (data) => {text+=data.toString('utf8');return null;}
            }, options)).then((code) => {
                resolve(text);
            }).catch(reject);
        })
    }

    spawn(...args) {
        return utils.spawn(...args);
    }

	download(url, file) {

        return new Promise((resolve, reject) => {
            let target = file;
            if(this.args.force && fs.existsSync(target))
                fs.unlinkSync(target);

            if(fs.existsSync(target)) {
                this.log(`File found at ${target}`);
                this.log(`Skipping download...`);
                return resolve();
            }

            let  MAX = Math.max((process.stdout.columns || 0) - 55, 5), MIN = 0, value = 0;
            this.log("Fetching: "+url);
            console.log("");

            progress(
                request({ url, headers: { 'User-Agent': 'KDX' } }), 
                { throttle : 250, delay : 1000 }
            )
            .on('progress', function (state) {
                if(state.percent > 0.99)
                    state.percent = 1;

                if(!state.percent)
                    state.percent = 0;

                let value = Math.ceil(state.percent * MAX);
                    console.log('\x1B[1A\x1B[K|' +
                        (new Array(value + 1)).join('█') + '' +
                        (new Array(MAX - value + 1)).join('-') + '|  ' + (state.percent*100).toFixed(1) + '%  '
                        + state.size.transferred.toFileSize().split(' ').shift()+'/'
                        + state.size.total.toFileSize()+'  '
                        + (state.speed || 0).toFileSize()+'/s'
                    );
            })
            .on('error', function (err) {
                console.log("download->error", err);
                reject(err);
            })
            .pipe(fs.createWriteStream(target))
            .on('finish', function(err) {
                console.log('\x1B[1A\x1B[K'+(new Array(80)).join(' '))
                process.stdout.write('\x1B[1A\x1B[K');
                //process.stdout.write('\x1B[1A\x1B[K\n');
                err && this.log(err.toString());
                resolve();
            });
        });
	}

    
	async extract(from,to) {
		let stats = fs.statSync(from);
		let archiveSize = stats.size;

        this.log("Extracting: "+from);
        console.log("");

		let lastSize = 0;
		let  MAX = 36, MIN = 0, value = 0;
		let entries = 0; let sizeC = 0, sizeUC = 0;
		let ts = 0;
		await extract(from, { dir: to, onEntry : (entry, zipfile)=> {
			sizeC += entry.compressedSize;
			sizeUC += entry.uncompressedSize;
			entries++;
			
			let update = false;
			let now = Date.now();
			if(now - ts > 750) {
				update = true;
				ts = now;
			}

			if(update) {
				let percent = sizeC / archiveSize;
				let tick = (sizeC - lastSize)/1024/1024;
				lastSize = sizeC;
				let value = Math.ceil(percent * MAX);
                console.log('\x1B[1A\x1B[K'+'|' +
                    (new Array(value + 1)).join('█') + '' +
                    (new Array(MAX - value + 1)).join('-') + '|  ' + (percent*100).toFixed(1) + '%  '
                    + sizeC.toFileSize().split(' ').shift()+'/'
                    + archiveSize.toFileSize()+'   '
                    //+ (state.speed || 0).toFileSize()+'/s'
                    +''
                );
			}
		}});

        console.log('\x1B[1A\x1B[K'+(new Array(80)).join(' '));
        process.stdout.write('\x1B[1A\x1B[K');
        // this.console.log('...done');
	}


	clone(url, folder, options = { }) {
		let { target, branch } = options;
		return new Promise(async (resolve,reject) => {
			mkdirp.sync(folder);
			let repo = path.basename(url).replace(/\.git$/ig,'');
			target = target || repo;
			let dest = path.join(folder,target);

            if(this.args[`${repo}-branch`])
                branch = this.args[`${repo}-branch`];
            else
            if(this.args[`branch-${repo}`])
                branch = this.args[`branch-${repo}`];
			branch = branch || 'master';

			if(this.args['--no-ssh'] || this.args['--http'] || this.args['--https']) {
				let { base, address, organization, project } = this.utils.match(url,/(?<base>(git@|\w+@|https:\/\/)(?<address>[\w-]+\.\w+)[:\/])(?<organization>[\w]+)\/(?<project>[\w]+)(\.git)?/);
				if(base && address && organization && project) {
					url = `https://${address}/${organization}/${project}`;
				}
			}

		    if(!fs.existsSync(dest)) {
				let args = ['clone','-b',branch,url];
		    	if(target != repo)
		    		args.push(target);
		        await this.spawn('git',args, {
		            cwd : folder, stdio : 'inherit'
		        })
		    }
		    else {
		        await this.spawn('git',['fsck'], {
		            cwd : dest, stdio : 'inherit'
		        })
		        await this.spawn('git',['checkout',branch], {
		            cwd : dest, stdio : 'inherit'
		        })
		        await this.spawn('git',['pull'], {
		            cwd : dest, stdio : 'inherit'
		        })
		    }

		    resolve();
		})
	}

}



(async ()=>{
    const build = new Build();
    build.main();
})();

function showDepsError() {
    console.log(`

Hm.. it looks like you don't have dependencies installed.

Before building Kaspa, you need to do some setup:
From the kdx folder:

    
    
    `);
    process.exit(1);
}