true && nw.Window.get().showDevTools();
const app = nw.Window.get().app;
const os = require("os");

class Initializer{
	constructor(){
		this.init();
	}
	init(){
		let config = app.getConfig({})
        var chooser = $("#data-folder-input");
        chooser.change(function(evt) {
          console.log($(this).val());
        });
        //chooser.trigger('click'); 
		$("flow-btn.save-config").on("click", ()=>{

		})
	}
	saveConfig(config){
		//console.log("saveConfig:config", config)
		try{
			config = JSON.parse(config);
		}catch(e){
			return
		}
		app.setConfig(config);
		app.restartDaemons();
	}
}

const initializer = new Initializer();
app.emit("ui-init");
