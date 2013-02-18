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

