# KDX

KDX is a dedicated desktop process manager for Kaspa software stack.

KDX is meant to be a swiss-knife application that compliments the Kaspa project.
KDX is capable of configuring and running Kaspa full node, Kasparov API server, Kasparov Sync server, Mosquitto MQTT broker, PostgreSQL as well as other applications if needed. Child processes are isolated in their separate data folders and all processes output is available at run-time in the KDX UI or via log files managed by KDX.

KDX offers a miniature console using which user can re-build the Kaspa stack, upgrading Kaspa to the latest version directly from GitHub. The build process is automated via a series of scripts that, if
needed, fetch required tools (git, go, gcc) and build Kaspa on the host computer (the build includes various Kaspa utilities including `txgen`, `wallet`, `kaspactl` and others and can be executed against any specific Git branch).  KDX console can also be used to migrate Kasparov database if building a version with an updated database schema.

KDX process configuration (available via a simple JSON editor) allows user to specify command-line arguments for executables, as such it is possible to configure KDX to run multiple instances of Kaspa or potentially run multiple networks simultaneously (provided Kaspa nodes do not pro-actively auto-discover each-other)

Like many desktop applications, KDX can run in the tray bar, out of the way.

KDX is built using [NWJS](https://nwjs.io) and is compatible Windows, Linux and Mac OS X.


## Building KDX

### Pre-requisites

- [Node.js 14.0.0+](https://nodejs.org/)

**NOTE:** KDX build process builds and includes latest Kaspa binaries from Git master branches. 
To build from specific branches, you can use `--branch...` flags (see below).

#### Generating KDX installers
```
npm install emanator@latest
git clone git@github.com:aspectron/kdx
cd kdx
# run emanate with one or multiple flags below
#  --portable   create a portable zipped application
#  --innosetup  generate Windows setup execitable
#  --dmg        generate a DMG image for Mac OS X
#  --all        generate all OS compatible packages
emanate [--portable | --innosetup | --dmg | --all]
```

#### Running KDX from development environment


In addition to Node.js, please download and install [Latest NWJS SDK https://nwjs.io](https://nwjs.io/) - make sure that `nw` executable is available in the system PATH and that you can run `nw` from command line.

```
npm install emanator@latest
git clone git@github.com:aspectron/kdx
cd kdx
emanate --local-binaries
nw .
```

To build additional utilities such as `txgen` you can run 
```
emanate --local-binaries --with-extras --with-dagviz --with-kasperf
```

#### Building installers from specific Kaspa Git branches

`--branch` argument specifies common branch name for kaspa and kasparov, for example:
```
emanate --branch=v0.4.0-dev 
```
The branch for each repository can be overriden using `--branch-<repo-name>=<branch-name>` arguments as follows:
```
emanate --branch=v0.4.0-dev --branch-kaspad=v0.3.0-dev
emanate --branch-miningsimulator=v0.1.2-dev
```

**NOTE:** KDX `build` command in KDX console operates in the same manner and accepts `--branch...` arguments.




## KDX Process Manager

### Configuration

KDX runtime configuration is declared using a JSON object.  KDX supports a number of built-in process types (all components of the Kaspa software stack) as well as external applications.

Each instance of the process is declared using it's **type** (for example: `kaspad`) and a unique **identifier** (`kd0`).  Most process configuration objects support `args` property that allows
passing arguments or configuration options directly to the process executable.  Depending on the process type, the configuration is passed via command line arguments (kasparov*) or configuration file (kaspad).

Supported process types:
- `kaspad` - Kaspa full node
- `kasparovd` - Kasparov API Server
- `kasparovsyncd` - Kasparov Sync Server
- `mqtt` - Mosquitto MQTT Broker
- `pgsql` - PostgreSQL Database
- `simulator` - `miningsimulator` application
- `app` - External application/plugin

**NOTE:** For Kaspa, to specify multiple connection endpoints, you must use an array of addresses as follows: ` "args" : { "connect" : [ "peer-addr-port-a", "peer-addr-port-b", ...] }`

#### Default Configuration File
```js
{
	"kaspad:kd0": {
		"args": {
			"rpclisten": "0.0.0.0:16210",
			"listen": "0.0.0.0:16211",
			"profile": 7000,
			"rpcuser": "user",
			"rpcpass": "pass"
		}
	},
	"kaspad:kd1": {
		"args": {
			"rpclisten": "0.0.0.0:16310",
			"listen": "0.0.0.0:16311",
			"profile": 7001,
			"connect": "0.0.0.0:16211",
			"rpcuser": "user",
			"rpcpass": "pass"
		}
	},
	"simulator:sim0": {
        "blockdelay" : 2000,
		"peers": [ "127.0.0.1:16310" ]
	},
	"pgsql:db0": {
		"port": 18787
	},
	"mqtt:mq0": {
		"port": 18792
	},
	"kasparovsyncd:kvsd0": {
		"args": {
			"rpcserver": "localhost:16310",
			"dbaddress": "localhost:18787"
			"mqttaddress": "localhost:18792",
			"mqttuser" : "user",
			"mqttpass" : "pass"
		}
	},
	"kasparovd:kvd0": {
		"args": {
			"listen": "localhost:11224",
			"rpcserver": "localhost:16310",
			"dbaddress": "localhost:18787"
		}
	}
}
```

### Data Storage

KDX stores it's configuration file as `~/.kdx/config.json`.  Each configured process data is stored in `<datadir>/<process-type>-<process-identifier>` where `datadir` is a user-configurable location.  The default `datadir` location is `~/.kdx/data/`.  For example, `kaspad` process with identifier `kd0` will be stored in `~/.kdx/data/kaspad-kd0/` and it's logs in `~/.kdx/data/kaspad-kd0/logs/kaspad.log`

### Kaspa Binaries

KDX can run Kaspa from 2 locations - an integrated `bin` folder that is included with KDX redistributables and `~/.kdx/bin` folder that is created during the Kaspa build process. 

## KDX Console

KDX Console provides following functionality:
- Upgrading kasparov using `migrate` command
- `start` and `stop` controls stack runtime
- Kaspad RPC command execution
- Use of test wallet app (KDX auto-configures kasparov address)
- Rebuilding Kaspa software stack from within the console

### Using Kaspad RPC

Kaspad RPC can be accessed via KDX Console using the process identifier. For example:
```
$ kd0 help
$ kd0 getinfo
```
Note that RPC methods are case insensitive.

To supply RPC call arguments, you must supply and array of JSON-compliant values (numbers, double-quote-enclosed strings and 'true'/'false').  For example:
```
$ kd0 getblock "000000b22ce2fcea335cbaf5bc5e4911b0d4d43c1421415846509fc77ec643a7"
{
  "hash": "000000b22ce2fcea335cbaf5bc5e4911b0d4d43c1421415846509fc77ec643a7",
  "confirmations": 83,
  "size": 673,
  "blueScore": 46241,
  ...
}
```

### Building Kaspa in KDX Console

WARNING - these are experimental features that may not function correctly on all operating systems (but should be compatible with most).

To build latest Kaspad binaries, switch to KDX console and run `build`:
```
$ build
...
```

This will produce a `local` build in `~/.kdx/bin` and switch KDX into `local` build mode.  

Build type can be `generic` (included with KDX redistributables) or `local` (build produced as a result of running KDX build process)

You can check and switch build type using the `set` command:
```
$ set

build type is 'local'

use 'set <key> <value>' to change settings
$ set build generic
setting build type to 'generic'
```

**NOTE:** `build` command accepts same `--branch...` series of flags as the emanator build process described above.
