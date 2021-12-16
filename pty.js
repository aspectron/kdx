    const path = require('path');
    const PTY = require('node-pty');
    const args = process.argv.slice(2);

    const { COLS, ROWS } = process.env;

    let proc = PTY.spawn(args.shift(), args, Object.assign({
        //	cwd,
        cols : parseInt(COLS),
        rows : parseInt(ROWS),
        stdio : 'pipe'
        //	detached : true
    }, { /* options */ }));

    proc.onData((data) => {
        data = data.replace(/\033\]0;.*\033\[\?25h/g,'');
        data = data.replace(/\033\[2J\033\[m\033\[H/g,'');
        data = data.replace(/kaspawallet/g, 'native-wallet')
        process.stdout.write(data);
    })

    process.stdin.on('data', (data) => {
        proc.write(data);
    })

    proc.onExit((code, signal) => {
        process.exit(code);
    })

