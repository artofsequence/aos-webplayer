/*
     Navigation...
*/

AOSWP_Navigation = function ($aosl_navigation_doc, interpreter ) {
   
    if (!$aosl_navigation_doc || $aosl_navigation_doc.size() == 0) {
        return null;
    }

    var event_list = [];

    function Event($aosl_event)
    {
        // NOTE: the implementation should be in the View?
        var EVENT_IMPL = {
            "selection": {
                start: function () {
                    var objects_id = $aosl_event.attr("object");
                    var selection_move_id = $aosl_event.attr("move");
                    console.log("SELECTION START : " + objects_id);

                    interpreter.view().connect_selection(objects_id, selection_move_id);

                }
                , stop: function () {
                    var objects_id = $aosl_event.attr("object");
                    var selection_move_id = $aosl_event.attr("move");
                    console.log("SELECTION STOP : " + objects_id);

                    interpreter.view().disconnect_selection(objects_id, selection_move_id);

                }
            }
        };

        var event_type = $aosl_event.prop("nodeName");
        
        return {
            start: function () {
                EVENT_IMPL[event_type].start();
            }
        , stop: function () {
            EVENT_IMPL[event_type].stop();
        }
        }
    }
    
    // for now we support only 'selection'
    $aosl_navigation_doc.children().each(function (idx) {
        var navi_event = Event($(this));
        event_list.push(navi_event);
    });

    return {
        start: function (stage) {
            // console.log("Navigation start");
            for( var idx = 0; idx < event_list.length; ++idx )
            {
                var event = event_list[idx];
                event.start();
            }
        }
    , stop: function (stage) {
        // console.log("Navigation stop");
        var reversed_event_list = event_list.slice().reverse();
        for (var idx = 0; idx < reversed_event_list.length; ++idx) {
            var event = reversed_event_list[idx];
            event.stop();
        }
    }
    };

};