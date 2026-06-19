//
//  Pure-JS process listing for KDX's process monitor.
//
//  Based on the sindresorhus ps-list module
//  (https://github.com/sindresorhus/ps-list/blob/master/index.js),
//  included directly here and extended for KDX. ps-list is NOT used as
//  an npm dependency because its package ships foreign executables
//  (the `fastlist` Windows helper); since KDX is a crypto application
//  we do not want unaudited binaries in the tree. This file therefore
//  shells out to the platform's own tools only:
//
//    - Linux / macOS : `ps -o ...`
//    - Windows       : PowerShell `Get-CimInstance Win32_Process`
//
//  It replaces the former native `@aspectron/process-list` (nan) addon,
//  whose ABI rebuild against current NW.js is infeasible on a
//  Python-3-only host (nw-gyp is Python-2-only).
//
//  Output: an array of process records with the fields the monitor's
//  snapshot needs, mapped from the columns each platform exposes:
//
//    pid     - process id
//    ppid    - parent process id
//    name    - executable basename
//    cmd     - full command line (the snapshot `cmdline` field)
//    cpu     - CPU percentage (%cpu); Windows reports no percentage here
//    memory  - memory percentage (%mem); not available on Windows
//    pmem    - resident memory in bytes (ps `rss`; Windows WorkingSetSize)
//    vmem    - virtual memory in bytes (ps `vsz`; Windows VirtualSize)
//    threads - thread count (Linux `nlwp`; Windows ThreadCount;
//              not available from macOS `ps`)
//
//  Fields a platform's tool does not expose are left undefined. In
//  particular the user/system CPU-time split (utime/stime) is not a
//  portable `ps -o` column and is not captured here; the monitor's
//  consumers use cpu/memory/pmem/vmem only.
//

'use strict';
const util = require('util');
const path = require('path');
const childProcess = require('child_process');

const TEN_MEGABYTES = 1000 * 1000 * 10;
const KIB = 1024;
const execFile = util.promisify(childProcess.execFile);

// ps reports rss/vsz in 1 KiB blocks; the monitor wants bytes.
const kibToBytes = (value) => {
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) ? n * KIB : undefined;
};

const intOrUndefined = (value) => {
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) ? n : undefined;
};

// Linux `ps` exposes `nlwp` (thread count); BSD/macOS `ps` does not.
const psSupportsThreads = process.platform === 'linux';

const nonWindows = async (options = {}) => {
	// All leading columns are space-free numerics; `args` (the full
	// command line) is last and captured as the remainder of the line,
	// which sidesteps the comm/args whitespace-splitting problem.
	const flags = (options.all === false ? '' : 'a') + 'wwxo';
	const fields = psSupportsThreads
		? 'pid=,ppid=,%cpu=,%mem=,rss=,vsz=,nlwp=,args='
		: 'pid=,ppid=,%cpu=,%mem=,rss=,vsz=,args=';

	const {stdout} = await execFile('ps', [flags, fields], {maxBuffer: TEN_MEGABYTES});

	const lineRegex = psSupportsThreads
		? /^\s*(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/
		: /^\s*(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+)\s+(\d+)\s+(.*)$/;

	const processes = [];
	for (const line of stdout.trim().split('\n')) {
		const match = lineRegex.exec(line);
		if (!match) {
			continue;
		}

		let pid;
		let ppid;
		let cpu;
		let memory;
		let rss;
		let vsz;
		let threads;
		let cmd;

		if (psSupportsThreads) {
			[, pid, ppid, cpu, memory, rss, vsz, threads, cmd] = match;
		} else {
			[, pid, ppid, cpu, memory, rss, vsz, cmd] = match;
		}

		cmd = cmd.trim();
		processes.push({
			pid: Number.parseInt(pid, 10),
			ppid: Number.parseInt(ppid, 10),
			name: path.basename(cmd.split(' ', 1)[0] || ''),
			cmd,
			cpu: Number.parseFloat(cpu),
			memory: Number.parseFloat(memory),
			pmem: kibToBytes(rss),
			vmem: kibToBytes(vsz),
			threads: threads === undefined ? undefined : Number.parseInt(threads, 10)
		});
	}

	return processes;
};

// Field separator for the Windows path: ASCII SOH (0x01), which cannot
// appear in a process name or command line, so split() is unambiguous.
const WINDOWS_FIELD_SEP = String.fromCharCode(1);

const windows = async () => {
	// PowerShell over CIM replaces the former bundled `fastlist.exe`
	// (deliberately not shipped - see file header). One record per line.
	// The Windows path is untested on non-Windows build hosts.
	const script =
		'Get-CimInstance Win32_Process | ForEach-Object { ' +
		'$_.ProcessId, $_.ParentProcessId, $_.ThreadCount, ' +
		'$_.WorkingSetSize, $_.VirtualSize, $_.Name, $_.CommandLine ' +
		'-join [char]1 }';

	const {stdout} = await execFile(
		'powershell.exe',
		['-NoProfile', '-NonInteractive', '-Command', script],
		{maxBuffer: TEN_MEGABYTES, windowsHide: true}
	);

	const processes = [];
	for (const line of stdout.trim().split(/\r?\n/)) {
		const parts = line.split(WINDOWS_FIELD_SEP);
		if (parts.length < 7) {
			continue;
		}

		const [pid, ppid, threads, ws, vsize, name, commandLine] = parts;
		processes.push({
			pid: Number.parseInt(pid, 10),
			ppid: Number.parseInt(ppid, 10),
			name: (name || '').trim(),
			cmd: (commandLine || name || '').trim(),
			cpu: undefined,
			memory: undefined,
			pmem: intOrUndefined(ws),
			vmem: intOrUndefined(vsize),
			threads: intOrUndefined(threads)
		});
	}

	return processes;
};

module.exports = process.platform === 'win32' ? windows : nonWindows;
