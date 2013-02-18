/*
     Objects in a CanvasState.
     Represent the state of an object in the canvas.
     Also owns it's final representation (for example an HTML element).
*/


AOSWP_Object = function ($aosl_object_doc, library) {

    // gather basic infos
    var object_id = $aosl_object_doc.attr("id");
    var object_is_active = ($aosl_object_doc.attr("active") == "true");
    var object_type = $aosl_object_doc.prop("nodeName");
    var object_children = [];
    var object_resource = null;
    var resource_id = $aosl_object_doc.attr("resource");
    if (resource_id) {
        object_resource = library.find_resource(resource_id);
        if (!object_resource)
            console.log("AOSWP: Resource '" + resource_id + "' for object '" + object_id + "' not found!");
    }

    var object_type_properties = {};
    var past_transforms = []; // THIS IS TEMPORARY, FIX ME BY REDESIGNING REVERTS!!!

    var on_resource_loaded = function () {

        var GraphicProperties = function ($aosl_object_doc) {
            var $graphic = $aosl_object_doc.children("graphic");
            if (!$graphic)
            {
                return {
                    size: AOSWP_Vector3()
                    ,transformation:AOSWP_Transformation()
                };
            }
                

            var $output = $graphic.children("output");

            var GraphicOutputSize = function ($graphic) {

                var default_size = AOSWP_Vector3({
                    x: object_resource.width,
                    y: object_resource.height
                });
                
                if ($output) 
                    return AOSWP_Vector3(default_size, $output.children("size"));
                else
                    return default_size;
            };

            var graphic_output = AOSWP_Box(GraphicOutputSize($graphic), AOSWP_Transformation(null, $output.children("transformation")));
            var graphic_input = AOSWP_Box(); // TODO : manage input data too!!!

            return {
                output: graphic_output
            , input: graphic_input
            };
        };

        var StreamProperties = function ($aosl_object_doc) {

            return null;
        };

        object_type_properties["graphic"] = GraphicProperties($aosl_object_doc);
        object_type_properties["stream"] = StreamProperties($aosl_object_doc);
    };

    if (object_resource)
    {
        if (object_resource.is_loaded) {
            on_resource_loaded();
        }
        else {
            object_resource.observers.push(on_resource_loaded);
        }
    }
    

    $aosl_object_doc.children("children").children().each(function () {
        var child_object = AOSWP_Object($(this), library);
        object_children.push(child_object);
    });

    var activate = function () {
        if (object_is_active)
            return false;
        object_is_active = true;
        console.log("AOSWP: object " + object_id + " ACTIVATED");
        return true;
    };
    var deactivate = function () {
        if (!object_is_active)
            return false;
        object_is_active = false;
        console.log("AOSWP: object " + object_id + " DEACTIVATED");
        return true;
    };
    var switch_state = function () {
        console.log("AOSWP: object " + object_id + " SWITCH");
        if (object_is_active)
            return deactivate();
        else
            return activate();
    };
    var transform = function (transformation, relative_to_parent) {

        if ( object_type_properties.graphic
            && object_type_properties.graphic.output)
        {
            past_transforms.push(object_type_properties.graphic.output.transformation);
            console.log("AOSWP: (graphic) object " + object_id + " TRANSFORM");
            if (relative_to_parent)
                object_type_properties.graphic.output.transformation = object_type_properties.graphic.output.transformation.transform(transformation);
            else
                object_type_properties.graphic.output.transformation = transformation;
        }

        for_each_child(function (child) { child.transform(transformation, relative_to_parent); });
        return true;
    };
    var transform_back = function()
    {
        if (object_type_properties.graphic
            && object_type_properties.graphic.output
            && past_transforms.length > 0
            ) {
            object_type_properties.graphic.output.transformation = past_transforms.pop();

        }
        for_each_child(function (child) { child.transform_back(); });
        return true;
    }

    var for_each_child = function (work_func) {
        for (var child_idx = 0; child_idx < object_children.length; ++child_idx) {
            work_func(object_children[child_idx]);
        }
    };

    if (object_is_active)
        activate();
    else
        deactivate();

    return {

        activate: activate
    , deactivate: deactivate
    , switch_state: switch_state
    , transform: transform
    , transform_back: transform_back
    , id: function () { return object_id; }
    , for_each_child: for_each_child
    , is_active: function () { return object_is_active; }
    , type: function () { return object_type; }
    , resource: function () { return object_resource; }
    , type_properties: function () { return object_type_properties;}
    };
}