/*
	CanvasState represent the state model of the canvas at a given time.
	The state is basically the state of objects.

*/

// require AOSWP/Object.js

AOSWP_CanvasState = function ($aosl_canvas_doc, library ) {
    var root_objects = [];
    var object_registry = {};
    var layer_registry = {};
    

    var $area = $aosl_canvas_doc.children("area");
    var canvas_area = {
        x: $area.attr("x")
    ,   y: $area.attr("y")
    ,   z: $area.attr("z")
    };

    var background_color = $aosl_canvas_doc.attr("color");
    if (!background_color)
        background_color = 'black';

    var for_each_ref_object = function( object_ref, work_func )
    {
        
        if (object_ref == "#all")
        {
            return for_each_object(work_func);
        }
        else 
        {
            var changed_objects = "";
            var object_ref_list = object_ref.match(/[^ ]+/g);

            if (object_ref_list)
            {
                for (var idx = 0; idx < object_ref_list.length; ++idx) {
                    var object_id = object_ref_list[idx];
                    if (work_func(object_registry[object_id]))
                        changed_objects += object_id + ' ';
                }
            }
            
            return changed_objects;
        }
        
    }

    var activate_object = function (object_id) {
        return for_each_ref_object(object_id, function (object) { return object.activate(); });
       
    };
    var deactivate_object = function (object_id) {
        return for_each_ref_object(object_id, function (object) { return object.deactivate(); });
    };
    var switch_object = function (object_id) {
        return for_each_ref_object(object_id, function (object) { return object.switch_state(); });
    };
    var transform_object = function (object_id, transformation, relative_to_parent) {
        return for_each_ref_object(object_id, function (object) { return object.transform(transformation, relative_to_parent); });
    };
    var transform_object_back = function (object_id) {
        return for_each_ref_object(object_id, function (object) { return object.transform_back(); });
    };
    var activate_layer = function (layer_id) {
        return layer_registry[layer_id].activate();
    };
    var deactivate_layer = function (layer_id) {
        return layer_registry[layer_id].deactivate();
    };
    var switch_layer = function (layer_id) {
        return layer_registry[layer_id].switch_state();
    };
    
    var for_each_object = function (workfunc) {
        var changed_objects = "";
        for (var object_id in object_registry) {
            var object = object_registry[object_id];
            if (workfunc(object))
                changed_objects += object_id + ' ';
        }
        return changed_objects;
    };

    var for_each_root_object = function (workfunc) {
        var changed_objects = "";
        for (var idx in root_objects) {
            var root_object = root_objects[idx];
            if (workfunc(root_object))
                changed_objects += root_object.id() + ' ';
            
        }
        return changed_objects;
    };

    var register_object = function (object) {
        object_registry[object.id()] = object;
        object.for_each_child(function (child_object) {
            register_object(child_object);
        });
    };
    
    // create the objects at their initial state and register them in a big list
    var $root_objects = $aosl_canvas_doc.children("objects");
    $root_objects.children().each(function (idx, dom_object) {

        var object = AOSWP_Object($(dom_object), library); // will call itself recursively for children
        root_objects[idx] = object; // put root objects in a root list
        register_object(object); // register object in the big list of objects
    });



    // register layers

    var $layers = $aosl_canvas_doc.children("layers");
    $layers.children("layer").each(function (idx, $layer) {
        var layer = AOSWP_Layer($layer, object_registry); // will build a list of objects for itself
        layer_registry[layer.id()] = layer; // register the layer
    });


    return {
        activate_object: activate_object
    , deactivate_object: deactivate_object
    , switch_object: switch_object
    , transform_object: transform_object
    , transform_object_back: transform_object_back
    , activate_layer: activate_layer
    , deactivate_layer: deactivate_layer
    , switch_layer: switch_layer
    , area: function () { return canvas_area; }
    , color: function () { return background_color; }
    , for_each_object: for_each_object
    , for_each_ref_object: for_each_ref_object
    , for_each_root_object: for_each_root_object
    };
};
