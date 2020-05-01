import {html} from 'lit-html';

let testDialogs = ()=>{
	$('#test-ui').html(
		`<flow-btn class="alert-btn-text">Alert</flow-btn>
		<flow-btn class="prompt-btn-text">Prompt</flow-btn>`
	)
	$('.alert-btn-text').on("click", async ()=>{
		let btns = ["Info:info", {text:"Warning", cls:"warning"}, {text:"Success", cls:'success'}, {text:"Danger", cls:"danger"}]
		let {btn, values} = await FlowDialog.alert("Title", "Hello", 1, '', btns)
		console.log("btn", btn, values)
	})

	$('.prompt-btn-text').on("click", async ()=>{
		
		let handler = async(resolve, result, dialog, btn, e)=>{
			console.log("dialog, result, btn, e", dialog, result, btn, e);
			let list = Object.entries(result.values);
			let body = list.map(([k, v])=>html`<div>${k}: <b> ${v}</b></div>`);
			let btns = [{
				text:'Exit',
				cls:'warning',
				handler(_resolve){
					_resolve();
					resolve({btn:'exit'})
					FlowDialog.show("Oh No", "Try next time");
				}
			}, 'Retry', {
				text:'Perfect',
				cls:'primary',
				handler(_resolve){
					_resolve();
					resolve(result)
				}
			}]
			await FlowDialog.show(
				"Is this detail correct?", body, 1, 'dialog-cls', btns);
		}
		let btns = ["Cancel", {text:'Save', cls:'primary', value:"ok", handler}];
		let body = html`
			<div>
				<textarea cols="5" rows="3" name="desc"></textarea>
			</div>
			<div>
				<input class="input" value="Testing" name="text">
			</div>
			<flow-checkbox class="input" name="delete">Delete</flow-checkbox>
			<div>
				<flow-folder-input class="input" name="folder"></flow-folder-input>
			</div>
			`
		let modal = 1;
		let {btn,values} = await FlowDialog.show({
			title:"Enter Values", body, modal, cls:'dialog-cls', btns
		})
		console.log("btn", btn, values)
	})
}

window.testDialogs = testDialogs;