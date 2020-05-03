const utils = require('./utils');

class Builder {
    constructor() {

    }

    preflight() {
        try {
            let gcc = this.exec('gcc',['--version']);
            console.log(gcc);
            let go = this.exec('go',['--version']);
        } catch(err) {

        }
    }
}



