

 /************************* Geometry.js ************************/

 /*
     Transformation used for geometric manipulations.
*/

var AOSWP_Vector3 = function (default_values, $vector) {

    var vector = $vector && $vector.length > 0 ? {
        x: (parseFloat($vector.attr("x")))
        , y: (parseFloat($vector.attr("y")))
        , z: (parseFloat($vector.attr("z")))
    } : {
        x: (default_values && default_values.x ? default_values.x : 0.0)
        , y: (default_values && default_values.y ? default_values.y : 0.0)
        , z: (default_values && default_values.z ? default_values.z : 0.0)
    };

    for (idx in vector)
    {
        if(isNaN(vector[idx]))
        {
            vector[idx] = 0;
        }
    }

    vector.add = function (delta_vector) {
        return AOSWP_Vector3({
            x: (vector.x + delta_vector.x)
            , y: (vector.y + delta_vector.y)
            , z: (vector.z + delta_vector.z)
        });
    };

    vector.multiply = function (delta_vector) {
        return AOSWP_Vector3({
            x: (vector.x * delta_vector.x)
            , y: (vector.y * delta_vector.y)
            , z: (vector.z * delta_vector.z)
        });
    };

    vector.inverse = function() {
        return AOSWP_Vector3( {
            x: -(vector.x)
            , y: -(vector.y)
            , z: -(vector.z)
        });
    }

    // TODO: add some other functions, like distance

    return vector;
};

var AOSWP_Rotation3 = function (default_values, $rotation ) {
    var rotation = $rotation && $rotation.length > 0 ? {
        yaw: (parseFloat($rotation.attr("yaw")))
        , pitch: (parseFloat($rotation.attr("pitch")))
        , roll: (parseFloat($rotation.attr("roll")))
    } : {
        yaw: (default_values && default_values.yaw ? default_values.yaw : 0.0)
        , pitch: (default_values && default_values.pitch ? default_values.pitch : 0.0)
        , roll: (default_values && default_values.roll ? default_values.roll : 0.0)
    };

    rotation.rotate = function (delta_rotation, origin) {
        console.log("AOSWP: ROTATION NOT IMPLEMENTED YET!!!");
        return AOSWP_Rotation3(this);
    };

    rotation.inverse = function () {
        console.log("AOSWP: ROTATION INVERSION NOT IMPLEMENTED YET!!!");
        return AOSWP_Rotation3(this);
    }

    return rotation;
};

AOSWP_Transformation = function ( default_values, $aosl_transformation_doc) {

    var transformation;

    if ($aosl_transformation_doc) {
        var translation = AOSWP_Vector3(null, $aosl_transformation_doc.children("translation"));
        var scale = AOSWP_Vector3({ x: 1, y: 1, z: 1 }, $aosl_transformation_doc.children("scale"));
        var rotation = AOSWP_Rotation3(null, $aosl_transformation_doc.children("rotation"));
        var origin = AOSWP_Vector3(null, $aosl_transformation_doc.children("origin"));

        transformation = {
            translation: translation
        , scale: scale
        , rotation: rotation
        , origin: origin
        };
    }
    else if (default_values)
    {
        transformation = default_values;
    }
    else {
        transformation = {
            translation: AOSWP_Vector3()
        , scale: AOSWP_Vector3({ x: 1, y: 1, z: 1 })
        , rotation: AOSWP_Rotation3()
        , origin: AOSWP_Vector3()
        };
    }

    transformation.transform = function (other_transformation) {
        return AOSWP_Transformation({
            translation: transformation.translation.add(other_transformation.translation)
        , scale: transformation.scale.multiply(other_transformation.scale)
        , rotation: transformation.rotation.rotate(other_transformation.rotation, other_transformation.origin)
        , origin: transformation.origin
        });
    };

    transformation.inverse = function () {
        return AOSWP_Transformation({
            translation: transformation.translation.inverse()
        , scale: transformation.scale.inverse()
        , rotation: transformation.rotation.inverse()
        , origin: transformation.origin
        });
    }

    return transformation;
};

AOSWP_Box = function (default_size, default_transformation, $aosl_box_doc) {

    var box = {};

    if( $aosl_box_doc )
    {
        var $size = $aosl_box_doc.children("size");
        var $transformation = $aosl_box_doc.children("transformation");
        box.size = AOSWP_Vector3(null, $size ? $size : default_size);
        box.transformation = $transformation ? AOSWP_Transformation(null, $transformation) : AOSWP_Transformation();
    }
    else
    {
        box.size = default_size ? default_size : AOSWP_Vector3();
        box.transformation = default_transformation ? default_transformation : AOSWP_Transformation();
    }

    return box;
};

 /************************* View_Elements.js ************************/

 /*
    Provide final representation of the objects and canvas in the web page.
    This implementation uses HTML5 elements and CSS.

*/

AOSWP_View_Elements = function (aoswp_interpreter) {

    var Sprite = function (object) {

        var $object_div = $(document.createElement("div"));
        $object_div.css("position", "absolute");
        var view_id = "view_" + object.id();
        $object_div.attr("id", view_id);
        var children = [];
        var is_first_update = true;

        var for_each_child = function (func) {
            for (var idx = 0; idx < children.length; ++idx) {
                func(children[idx]);
            }
        }

        var view_activate = function () {
            $object_div.show();
        }
        var view_deactivate = function () {
            $object_div.hide();
        }
        var view_transform = function (graphic_output) {

            var transformation = graphic_output.transformation;

            // scaling

            $object_div.width(graphic_output.size.x * transformation.scale.x);
            $object_div.height(graphic_output.size.y * transformation.scale.y);

            // AOSL coordinate system is right-handed: origin is bottom left of the screen and y goes up
            var final_position = {
                left: transformation.translation.x
            , bottom: transformation.translation.y
            };

            $object_div.css(final_position);

            // TODO: add rotation information here
        };

        var view_update = function () {
            if (is_first_update) {

                $object_div.css("background", "url('" + object.resource().uri + "')");
                $object_div.css("background-repeat", " no-repeat");
                $object_div.css("background-size", "100%");
                
                is_first_update = false;
            }

            var graphic_output = object.type_properties().graphic.output;
            view_transform(graphic_output);
            // TODO: add sprite in image management here

            if (object.is_active()) // this might be a bit more complicated to implement: what if we don't want to re-call the current state?
                view_activate();
            else
                view_deactivate();

            for_each_child(function (child) {
                child.update();
            });
        };

        var resource = object.resource();
        if (resource) {
            if (resource.is_loaded) {
                view_update();
            }
            else {
                resource.observers.push(view_update);
            }
        }


        return {
            id: function () { return object.id(); }
            , impl: function () { return $object_div; }
            , add_child: function (child_view) {
                children.push(child_view);
            }
            , update: view_update
            , for_each_child: for_each_child
        };
    };

    var Group = function (object) {
        var children = [];

        var for_each_child = function (func) {
            for (var idx = 0; idx < children.length; ++idx) {
                func(children[idx]);
            }
        }

        return {
            id: function () { return object.id(); }
            , impl: function () { return null; }
            , add_child: function (child_view) {
                children.push(child_view);
            }
            , update: function () {
                for_each_child(function (child) {
                    child.update();
                });
            }
            , for_each_child: for_each_child
        }
    };

    var VIEW_FACTORY = {
        sprite: Sprite
    , group: Group
    };


    var ObjectView = function (aoswp_object) {
        var object_view = VIEW_FACTORY[aoswp_object.type()](aoswp_object);

        if (object_view) {
            aoswp_object.for_each_child(function (child_object) {
                var child_view = ObjectView(child_object);
                object_view.add_child(child_view);
            });

        }
        else {
            console.log("AOSWP: object type '" + aoswp_object.type() + "' is unknkown by view implementation!");
        }

        return object_view;
    };

    var CanvasView = function (aoswp_canvas) {
        var area = aoswp_canvas.area();
        var root_objects = [];
        var object_view_registry = {};

        
        var $canvas_content = $(document.createElement("div"));
        var $canvas_frame = $(document.createElement("iframe")).load(function () {
            
        var $this = $canvas_frame;
            $this.off("load"); // no need to reload this.

            $this.css("width", area.x);
            $this.css("height", area.y);
            $this.css("background-color", aoswp_canvas.color());
            $this.css("margin-left", "auto");
            $this.css("margin-right", "auto");
            //$this.css("position", "relative");
            $this.css("display", "block");
            $this.css("border", "none");
            $this.css("overflow", "hidden");
            $this.attr("scrolling", "no");



            //$canvas_content.width("100%");
            //$canvas_content.height("100%");
            //$canvas_content.css("background-color", aoswp_canvas.color());
            //$canvas_content.css("padding-left", "auto");
            //$canvas_content.css("padding-right", "auto");
            //$canvas_content.css("position", "relative");
                
            aoswp_canvas.for_each_root_object(function (object) {
                var object_view = ObjectView(object);
                if (object_view) {
                    root_objects.push(object_view);

                    var inject_view = function (object_view) {
                        $canvas_content.append(object_view.impl());
                        object_view_registry[object_view.id()] = object_view;
                        object_view.for_each_child(inject_view);
                    }

                    inject_view(object_view);
                }
                else {
                    // TODO : ?
                }

            });

            
            var $body = $this.contents().find("body");
            $body.attr("scroll", "no"); // for internet explorer...
            $body.append($canvas_content);
            console.log("AOSWP: View Canvas ready!");
            
        });


        var for_each_object_view = function (workfunc) {
            var changed_objects = "";
            for (var object_id in object_view_registry) {
                var object = object_view_registry[object_id];
                if (workfunc(object))
                    changed_objects += object_id + ' ';
            }
            return changed_objects;
        };

        var for_each_object_view_ref = function (object_ref, work_func) {
            if (object_ref == "#all") {
                return for_each_object_view(work_func);
            }
            else {
                var changed_objects = "";
                var object_ref_list = object_ref.match(/[^ ]+/g);

                if (object_ref_list)
                {
                    for (var idx = 0; idx < object_ref_list.length; ++idx) {
                        var object_id = object_ref_list[idx];
                        if (work_func(object_view_registry[object_id]))
                            changed_objects += object_id + ' ';
                    }

                }
                
                return changed_objects;
            }
        }
        
        return {
            impl: function () { return $canvas_frame; }
        , update: function () {
            for (var idx = 0; idx < root_objects.length; ++idx) {
                root_objects[idx].update();
            }

        }
        , update_object: function (object_id) {
            for_each_object_view_ref(object_id, function (object_view) {
                object_view.update();
            });   
        }
        , connect_selection: function (object_id, target_move_id ) {
            
            var select_by_click = function ($view_impl) {
                $view_impl.one("click", function () {
                    aoswp_interpreter.go_using_move(target_move_id);
                    return false; // don't propagate this click event
                });
            };

            if (object_id == "#all") {
                select_by_click($canvas_content);
                
            }
            else {
                for_each_object_view_ref(object_id, function (object_view) {
                    select_by_click(object_view.impl());
                });
            }

        }
        , disconnect_selection: function (object_id, target_move_id) {
            var deselect_by_click = function ($view_impl) {
                $view_impl.unbind("click");
            };

            if (object_id == "#all") {
                deselect_by_click($canvas_content);
            }
            else {
                for_each_object_view_ref(object_id, function (object_view) {
                    deselect_by_click(object_view.impl());
                });
            }
        }
        };
    };


    var canvas_view = CanvasView(aoswp_interpreter.canvas());

    return canvas_view;
};



 /************************* View.js ************************/

 /*
     Provide final representation of the objects and canvas in the web page.
*/

AOSWP_View = AOSWP_View_Elements; // for now, we only allow elements implementation.

 /************************* Library.js ************************/

 /*
	Library register all the resources that have to be loaded for the sequence.
*/


function escapeHTML(s) {
    return s.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
}
// Utility functions to get full url
function qualifyURL(url) {
    var el = document.createElement('div');
    el.innerHTML = '<a href="' + escapeHTML(url) + '">x</a>';
    return el.firstChild.href;
}


AOSWP_Library = function ($library) {

    
    
    var resource_registry = {};

    if (!$library) console.error("Library not found in Sequence document!");

    // load resources listed in a library
    var load_resources = function ($library) {

        console.log("AOSWP: loading resources from AOSL library...");

        $library.children("include").each(function (idx) {
            var $include = $(this);
            var library_uri = $include.text();
            console.log("AOSWP: including resources from '" + library_uri + "' ...");
            load_library(library_uri);
        });

        $library.children("resource").each(function (idx) {
            // preload the resource
            var $resource = $(this);
            var resource_id = $resource.attr("id");
            var resource_type = $resource.attr("type");
            var resource_uri = qualifyURL($resource.text());

            resource_registry[resource_id] = {
                type: resource_type
                , uri: resource_uri
                , is_loaded: false
                , observers: []
            };

            console.log("AOSWP: loading resource '" + resource_id + "' (type: " + resource_type + ", from: '" + resource_uri + "') ...");

            $.ajax({
                type: "GET",
                url: resource_uri,
                success: function (resource) {
                    
                    var resource_info = resource_registry[resource_id];

                    var once_loaded = function () {
                        resource_info.is_loaded = true;
                        for (idx in resource_info.observers) {
                            var observer = resource_info.observers[idx];
                            observer("loaded");
                        }

                        console.log("AOSWP: READY! - resource '" + resource_id + "' (type: " + resource_type + ", from: '" + resource_uri + "') ");
                    };

                    if( resource_type == "image")
                    {
                        $("<img />").attr("src", resource_uri).load(function () {
                                    resource_info.width = this.naturalWidth;
                                    resource_info.height = this.naturalHeight;
                                    once_loaded();
                        });

                    }
                        // TODO: add other resource types setup here
                    else
                    {
                        once_loaded();
                    }

                }
                
            });

        });
    };


    // load an external library file (include/import)
    var load_library = function (library_uri) {

        console.log("AOSWP: getting '" + library_uri + "' ...");

        var read_library = function (library_aosl) {

            var $ext_library = $(library_aosl);
            load_resources($library);
        };

        $.ajax({
            type: "GET",
            url: library_uri,
            dataType: "xml",
            success: read_library
        });

    };

    load_resources($library);

    return {
        find_resource: function (resource_id) {
            var res = resource_registry[resource_id];
            if (!res)
            {
                console.log("AOSWP: resource '" + resource_id + "' not found in library!");
                return null;
            }   
            else
            {
                return res;
            }
                
        },
    };

};

 /************************* Object.js ************************/

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

 /************************* Layer.js ************************/

 /*
     Layers gather a list of objects that can be activated/deactivated together.
*/


AOSWP_Layer = function ($aosl_layer_doc, object_registry) {

    var object_list = [];

    var layer_id = $aosl_layer_doc.attr("id").text();
    var active = new Boolean($aosl_layer_doc.attr("active"));

    var activate = function () {
        for_each_object(function (object) {
            if (!object.is_active())
                object.activate();
        });
    };
    var deactivate = function () {
        for_each_object(function (object) {
            if (object.active())
                object.deactivate();
        });
    };
    var switch_state = function () {
        for_each_object(function (object) {
            object.switch_state();
        });
    };

    // get all objects by id.
    $aosl_layer_doc.children("object").each(function (idx, $object_info) {
        var object_id = $object_info.text(); // TODO : trim it
        var object = object_registry[object_id];
        // TODO: add some checks here
        object_list.push(object);
    });

    // now apply the current state of the layer(? not sure it is necessary)
    if (active)
        activate();
    else
        deactivate();

    var for_each_object = function (modifier_func) {
        for (var idx in object_list) {
            modifier_func(object_list[idx]);
        }
    }

    return {
        id: function () { return layer_id; }
    , is_active: function () { return active; }
    , activate: activate
    , deactivate: deactivate
    , switch_state: switch_state
    };
};

 /************************* CanvasState.js ************************/

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


 /************************* Change.js ************************/

 /*
     Change implementations.
*/

AOSWP_Change = function ($aosl_change_doc, canvas) {
    var object_id = $aosl_change_doc.attr("object");
    var change_type = $aosl_change_doc.prop("nodeName");
    var was_successful = false;
    var changed_objects_id_list = [];

    var CHANGE_IMPL = {
        "activate": {
            apply: function ( object_ids ) {
                return canvas.activate_object(object_ids);
            }
          , reverse: function ( object_ids ) {
              return canvas.deactivate_object(object_ids);
          }
        }
    , "deactivate": {
        apply: function ( object_ids ) {
            return canvas.deactivate_object(object_ids);
        }
        , reverse: function ( object_ids ) {
            return canvas.activate_object(object_ids);
        }
    }
    , "switch": {
        apply: function ( object_ids ) {
            return canvas.switch_object(object_ids);
        }
        , reverse: function ( object_ids ) {
            return canvas.switch_object(object_ids);
        }
    }
    , "transform":
        {
            apply: function ( object_ids ) {

                var changed_objects_id = "";

                $aosl_change_doc.children("absolute,relative").each(function () {
                    var transformation = AOSWP_Transformation(null,$(this));
                    var is_relative_to_parent = ($(this).prop("nodeName") == "relative");
                    var changed_ids = canvas.transform_object(object_ids, transformation, is_relative_to_parent);
                    changed_objects_id += changed_ids + ' ';
                });

                return changed_objects_id;
            }
        , reverse: function ( object_ids ) {
            var reversed_objects_id = "";

            $($aosl_change_doc.children("absolute,relative").get().reverse()).each(function () {
                var changed_ids = canvas.transform_object_back(object_ids);
                reversed_objects_id += changed_ids + ' ';
            });

            return reversed_objects_id;
        }
        }
    };

    return {
        apply: function () {
            changed_objects_id_list.push(  CHANGE_IMPL[change_type].apply( object_id ) );
        }
    , reverse: function () {
            if (changed_objects_id_list.length > 0)
            {
                var changed_objects_id = changed_objects_id_list.pop();
                CHANGE_IMPL[change_type].reverse(changed_objects_id);
            }
        }
    }
}

 /************************* Navigation.js ************************/

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

 /************************* Story.js ************************/

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

 /************************* Interpreter.js ************************/

 
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



 /************************* aoswebplayer.js ************************/

 ﻿
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


