const isNw = typeof nw != 'undefined';
let App;
if (isNw)
	App = require("./nw-app.js").NWApp;
else
	App = require("./node-app.js").NodeApp;

/**
*
*/
const app = new App({
	appFolder: __dirname,
	ident: 'kdx',
	isNw
});

(async ()=>{
	await app.main();
})();
