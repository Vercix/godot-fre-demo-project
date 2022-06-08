
export default class TestClass extends godot.PanelContainer {
    //app = jsx(TestComp, {})
    constructor() {
        super();
    }

    // Called when the node enters the scene tree for the first time.
    _ready() {
        console.log('I entered the tree');
        this.folliwing = false; 
        this.dragging_start_position = new godot.Vector2(); 
    }

    _gui_input(event) {
        if (event instanceof godot.InputEventMouseButton) {
            if (event.get_button_index() == 1) {
                this.following = !this.following;
                this.dragging_start_position = this.get_local_mouse_position();
            }
        }
    }

    // Called every frame. 'delta' is the elapsed time since the previous frame.
    _process(delta) {
        if (this.following) {
            godot.OS.set_window_position(godot.OS.window_position + this.get_global_mouse_position() - this.dragging_start_position)
        }
    }

}

//godot
godot.register_class(TestClass, 'TestClass');
