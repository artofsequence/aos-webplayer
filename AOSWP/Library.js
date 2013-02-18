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