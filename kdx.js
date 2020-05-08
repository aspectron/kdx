const isNw = typeof nw != 'undefined';
let App;
if (isNw)
	App = require("./nw-app");
else
	App = require("./node-app");

/**
*
*/
const app = new App({
	appFolder: __dirname,
	ident: 'kdx'
});
