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