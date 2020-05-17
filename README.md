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

### Building KDX

**NOTE:** KDX build includes latest Kaspa binaries built from Git master branches. To build from specific branches, you can use `--branch...` flags (see below).

#### Generating KDX installers
```
npm install emanator@latest
git clone git@github.com:aspectron/kdx
cd kdx
# run emanate with one or multiple flags below
#  --portable   will create a portable zipped application
#  --innosetup  will generate Windows setup execitable
#  --dmg        will generate a DMG image for Mac OS X
#  --all        will generate all OS compatible packages
emanate [--portable | --innosetup | --dmg | --all]
```

#### Building from Git branches

`--branch` argument specifies common branch name for kaspad and kasparov, for example:
```
emanate --branch=v0.4.0-dev 
```
The branch for each repository can be overriden using `--branch-<repo-name>` arguments as follows:
```
emanate --branch=v0.4.0-dev --kaspad-branch=v0.3.0-dev
emanate --miningsimulator-branch=v0.1.2-dev
```
