const Mysql = require("../../lib/interfaces/mysql.js");
const KaspaProcessManager = require("../../lib/manager.js");
const Controller = require("./controller.js");

const core = new Controller();

//const mysql = new Mysql();

//console.log("mysql", mysql)

const manager = new KaspaProcessManager(core);
manager.start();
//console.log("manager", manager)
