import { render } from "./fre-godot";
import {jsx} from "./fre-godot/jsx-runtime"


export default class GodotFreApp extends godot.Control {
	//app = jsx(TestComp, {})
	constructor() {
		super();
		
	}
	
	// Called when the node enters the scene tree for the first time.
	async _ready() {
		console.log("_____Ready______");

  
		var test = await import(`res://build/src/components/${this.app}.jsx`)
		render(jsx(test.default), this);
		console.log("~~~~~~~~~~~~~~~~~~~~~~~");
	}
	
	// Called every frame. 'delta' is the elapsed time since the previous frame.
	_process(delta) {
		//Spark.workLoop()
	}
	
	
}

//godot
godot.register_class(GodotFreApp, 'GodotFreApp');
godot.set_script_icon(GodotFreApp, 'res://cross.png');
godot.register_property(GodotFreApp, 'app', 'ToDoList');
