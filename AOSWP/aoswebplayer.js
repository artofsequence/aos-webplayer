
// REQUIRES: jquery, jwerty

AOSWebPlayer = function ( config, container) {

    var interpreter = AOSWP_Interpreter(config, function (interpreter) {

        var view = AOSWP_View(interpreter);
        interpreter.set_view(view);
        view.impl().css("margin-left", "auto");
        view.impl().css("margin-right", "auto");

        var $player_div = $(container);
        $player_div.append(view.impl());

        var navigation_buttons_width = 100;

        var $previous_button = $(document.createElement("button"));
        $previous_button.hide(); // not visible at first
        $previous_button.css("background-color", "green");
        $previous_button.css("padding", 8);
        $previous_button.css("float", "left");
        $previous_button.width(navigation_buttons_width);
        $previous_button.text("[ ← ] Back");
        

        var $next_button = $(document.createElement("button"));
        $next_button.css("background-color", "red");
        $next_button.css("padding", 8);
        $next_button.css("float", "right");
        $next_button.width(navigation_buttons_width);
        $next_button.text("Next [ → ]");


        // Navigation buttons behaviour:

        var check_buttons_visibility = function()
        {
            if (interpreter.can_go_next())
                $next_button.show();
            else 
                $next_button.hide();

            if (interpreter.can_go_back())
                $previous_button.show();
            else
                $previous_button.hide();
        }

        interpreter.on_move(function () {
            check_buttons_visibility();
            view.impl().blur();
        });

        var go_back = function () {
            interpreter.go_back();
            return false;
        }
        var go_next = function () {
            interpreter.go_next();
            return false;
        }

        $previous_button.click( go_back );
        $next_button.click(go_next);

        var connect_keyboard = function( element )
        {
            jwerty.key('→', go_next, element);
            jwerty.key('↓', go_next, element);
            jwerty.key('space', go_next, element);
            jwerty.key('←', go_back, element);
            jwerty.key('↑', go_next, element);
            jwerty.key('shift+space', go_back, element);
        }
        connect_keyboard(view.impl().contents());

        check_buttons_visibility(); // make sure all is in place from the beginning

        var $control_div = $(document.createElement("div"));
        $control_div.css("margin-left", "auto");
        $control_div.css("margin-right", "auto");
        $control_div.append($previous_button);
        $control_div.append($next_button);
        $control_div.width(view.impl().width());

        $player_div.append($control_div);

        // this is to clear the divs states - hack hack hack hack
        var $clear_div = $(document.createElement("div"));
        $clear_div.css("clear", "both");
        $player_div.append($clear_div);

    });
    
    
    // return the object that allow controlling the player
    return interpreter;
}


