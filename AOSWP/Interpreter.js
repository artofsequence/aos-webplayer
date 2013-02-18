
/*
    The Interpreter is the engine of the player.
	It manipulate an Canvas state to get the final state to report on the real graphic canvas.

*/

AOSWP_version = "0.1"

// require AOSWP_Library, AOSWP_CanvasState

AOSWP_Interpreter = function ( config, then_func) {
    var sequence_library = null;
    var sequence_canvas = null;
    var sequence_story = null;

    var path = []; // [ { move: Move , from: Stage }, ... ]
    var current_stage = null;

    var raw_aosl = null;
    var on_ready_observers = [];
    var on_move_observers = [];

    var current_view = null;

    var check_stage = function () {
        if (!current_stage)
            WTF();
        console.log("AOSWP: Stage : '" + current_stage.id() + "' , steps = " + path.length);

    };

    var apply_move = function (move) {

        path.push({ move: move, from: current_stage });
        current_stage.leave();
        move.go_forward();
        current_stage = move.to();
        check_stage();
        current_stage.enter();
        if (current_view)
            current_view.update();
        notify_move();
    };

    var step_back = function () {
        var previous_step = path.pop();
        var previous_move = previous_step.move;
        current_stage.leave();
        previous_move.go_backward();
        current_stage = previous_step.from;
        check_stage();
        current_stage.enter();
        if (current_view)
            current_view.update();
        notify_move();
    };

    var notify_move = function( move_object, previous_stage, current_stage )
    {
        if (on_move_observers.length == 0)
            return; // be lazzy

        for( var idx = 0; idx < on_move_observers.length; ++idx)
        {
            on_move_observers[idx](move_object, previous_stage, current_stage);
        }
    }

    var can_go_back = function () { return (current_stage && path.length > 0); };
    var can_go_next = function () { return (current_stage && current_stage.next_default_move()); };

    var go_next = function () {
        if (current_stage) {
            var next_move = current_stage.next_default_move();
            if (next_move) {
                apply_move(next_move);
            }
        }
    }
    var go_using_move= function (move_id) {
        if (current_stage) {

            if (move_id == "#next") {
                go_next();
            }
            else {
                var move = current_stage.find_next_move(move_id);
                if (move) {
                    apply_move(move);
                }
                else {
                    console.log("AOSWP: tried to go through move '" + move_id + "' from stage '" + current_stage.id() + "' but it is not linked!");
                }
            }
            
        }
    }
    var go_back = function () {
        if (can_go_back()) {
            step_back();
        }
    }

    var interpreter = {
        canvas: function () { return sequence_canvas; }
    , can_go_back: can_go_back
    , can_go_next: can_go_next
    , go_next: go_next
    , go_using_move: go_using_move
    , go_back: go_back
    , activate_layer: function (layer_id) {
        sequence_canvas.activate_layer(layer_id);
    }
    , deactivate_layer: function (layer_id) {
        sequence_canvas.deactivate_layer(layer_id);
    }
    , ready: function (on_ready_func) {
        if (raw_aosl)
            on_ready_func(raw_aosl);
        else
            on_ready_observers.push(on_ready_func);
    }
    , on_move: function (on_move_func) {
        on_move_observers.push(on_move_func);
    }
    , version: function () { return String(AOSWP_version); }
    , view: function () { return current_view; }
    , set_view: function (new_view) { current_view = new_view; }
    };

    // function reading the sequence
    var read_AOSL = function (aosl_sequence) {
        raw_aosl = aosl_sequence;
        var $sequence = $($.parseXML(aosl_sequence)).find("sequence");
        sequence_library = AOSWP_Library($sequence.children("library"));
        sequence_canvas = AOSWP_CanvasState($sequence.children("canvas"), sequence_library);
        sequence_story = AOSWP_Story($sequence.children("story"), interpreter);
        current_stage = sequence_story.begin();
        
        if(then_func)
            then_func(interpreter);

        for (var idx = 0; idx < on_ready_observers.length; ++idx) {
            on_ready_observers[idx](raw_aosl);
        }

        current_stage.enter();
    };

    if (config.uri)
    {
        // load the sequence file
        $.ajax({
            type: "GET",
            url: config.uri,
            dataType: "text",
            success: read_AOSL
        });

    }
    else
    {
        if(config.aosl)
        {
            read_AOSL(config.aosl);
        }

    }


    return interpreter;
};

