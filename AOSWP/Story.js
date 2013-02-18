/*
     Simplified representation of the story graph.
*/

AOSWP_Story = function ($aosl_story_doc, interpreter) {
    var move_registry = {};
    var stage_registry = {};


    var default_navigation = AOSWP_Navigation($aosl_story_doc.children("navigation"), interpreter);

    function find_move(move_id) {
        return move_registry[move_id];
    }

    function find_stage(stage_ref) {
        // one or several ids
        var stage_ref_list = stage_ref.match(/[^ ]+/g);

        if (stage_ref_list && stage_ref_list.length > 1) {
            var refered_stages = [];
            for (var idx = 0; idx < stage_ref_list.length; ++idx) {
                var stage_id = stage_ref_list[idx];
                refered_stages.push(find_stage(stage_id));
            }
            return refered_stages;
        }

        if (stage_ref == "#all") {
            var refered_stages = [];
            for (var stage_id in stage_registry) {
                refered_stages.push(stage_registry[stage_id]);
            }

            return refered_stages;
        }

        return stage_registry[stage_ref];
    };


    function Stage($aosl_move_doc) {
        var stage_id = $aosl_move_doc.attr("id");
        var next_moves_from_here = [];
        var navigation = AOSWP_Navigation($aosl_move_doc.children("navigation"), interpreter );

        return {
            id: function () { return stage_id; }
        , add_next_move: function (move) { next_moves_from_here.push(move); }
        , next_default_move: function () {
            if (next_moves_from_here.length > 1) {
                for (var move_idx = 0; move_idx < next_moves_from_here.length; ++move_idx) {
                    var move = next_moves_from_here[move_idx];
                    if (move.is_default())
                        return move;
                }
                return null;
            }
            else if (next_moves_from_here.length == 1) {
                return next_moves_from_here[0];
            }
            else return null;

        }
        , find_next_move: function (move_id) {
            for (var idx = 0; idx < next_moves_from_here.length; ++idx) {
                var a_move = next_moves_from_here[idx];
                if (a_move.id() == move_id) {
                    return a_move;
                }

            }
            return null;
        }
        , enter : function()
        {
            console.log("AOSWP: Entering stage '" + stage_id + "'");

            if (navigation)
                navigation.start(this);
            else if (default_navigation)
                default_navigation.start(this);
            
        }
        , leave : function()
        {
            console.log("AOSWP: Leaving stage '" + stage_id + "'");

            if (navigation)
                navigation.stop(this);
            else if (default_navigation)
                default_navigation.stop(this);
        }
        };

    };

    function Move($aosl_move_doc) {
        var change_list = [];

        var move_id = $aosl_move_doc.attr("id");
        var move_from = find_stage($aosl_move_doc.attr("from")); // TODO: "special case" and "list"
        var move_to = find_stage($aosl_move_doc.attr("to"));
        var move_is_default = $aosl_move_doc.attr("default") == "true";
        var previous_stages = []; // stack of stages this move gone from

        $aosl_move_doc.children().each(function (idx, dom_change) {
            var $change = $(dom_change);
            var change = AOSWP_Change($change, interpreter.canvas());
            change_list.push(change);
        });

        return {
            id: function () { return move_id; }
        , from: function () { return move_from; }
        , to: function () { return move_to; }
        , is_default: function () { return move_is_default; }
        , go_forward: function () {
            console.log("AOSWP: Move forward (" + move_id + ")");
            for (var change_idx = 0; change_idx < change_list.length; ++change_idx) {
                change_list[change_idx].apply();
            }
        }
        , go_backward: function () {
            console.log("AOSWP: Move backward (" + move_id + ")");
            // THINK: is it ok? it might be inefficient...
            var reversed_change_list = change_list.slice().reverse();
            for (var change_idx = 0; change_idx < reversed_change_list.length; ++change_idx) {
                reversed_change_list[change_idx].reverse();
            }
        }
        };
    };

    // register all the stages
    $aosl_story_doc.children("stages").children("stage").each(function () {
        var stage = Stage($(this));
        stage_registry[stage.id()] = stage;
    });

    // register all the moves
    $aosl_story_doc.children("moves").children("move").each(function () {
        var move = Move($(this));
        move_registry[move.id()] = move;
    });

    // connect moves to stages
    for (move_id in move_registry) {
        var move = move_registry[move_id];
        var move_from = move.from();
        if (move_from instanceof Array) {
            for (var idx in move_from) {
                var stage = move_from[idx];
                stage.add_next_move(move);
            }
        }
        else if (move_from) {
            move_from.add_next_move(move);
        }
        else {
            WTF();
        }

    }


    
    var first_stage = find_stage($aosl_story_doc.attr("begin"));
    
    return {
        begin: function () { return first_stage; }
    ,   default_navigation: function () { return default_navigation; }
        //,   find_stage : find_stage
        //,   find_move : find_move
    };
};