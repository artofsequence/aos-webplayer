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