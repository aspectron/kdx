true && typeof(nw) != "undefined" && nw.Window && nw.Window.get().showDevTools()
let caption = document.querySelector('flow-caption-bar');
caption.tabs = [{
	title : "Home",
	id : "home"
},{
	title : "Settings",
	id : "settings"
},{
	title : "RPC",
	id : "rpc",
	disable:true
}];

caption["active-tab"] = "settings";

let settingsAdvanced = document.querySelector('#settings-advanced');
settingsAdvanced.addEventListener('changed', (e)=>{
	//console.log("settingsAdvanced", e.detail.checked)
	//caption.tabs[2].disable = !e.detail.checked;
	//caption.tabs = caption.tabs.slice(0);
	//caption.requestTabsUpdate();
	caption.set("tabs.2.disable", !e.detail.checked)
})

/*
caption.addEventListener('test', (e)=>{
	console.log("##### XXXXXXXXXXXXXXXXX ###### test-event", e)
})

//console.log("caption", caption, caption.fire)
document.addEventListener("WebComponentsReady", ()=>{
	//console.log("WebComponentsReady WebComponentsReady WebComponentsReady")
	caption.fire('test', {testing:true}, {bubbles:true})
})
*/