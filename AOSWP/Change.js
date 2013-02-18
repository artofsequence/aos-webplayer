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