import os
import shutil

MODULE_LIST = (	"Geometry.js"
			,	"View_Elements.js"
			,	"View.js"
			,	"Library.js"
			,	"Object.js"
			,	"Layer.js"
			,	"CanvasState.js"
			,	"Change.js"
			,	"Navigation.js"
			,	"Story.js"
			,	"Interpreter.js"
			,	"aoswebplayer.js"
)

AOSWP_COMPLETE_FILE = "AOSWP.js"
AOSWP_DEMO_LIB_FILE = "../demo/lib/" + AOSWP_COMPLETE_FILE

compiled_file = open( AOSWP_COMPLETE_FILE, "w", encoding="utf8" )

for module_file in MODULE_LIST:
	if module_file.endswith(".js"):
		code = open(module_file, encoding="utf8").read()
		compiled_file.write( "\n\n /************************* " + module_file + " ************************/\n\n " + code )

compiled_file.close()

shutil.copy( AOSWP_COMPLETE_FILE, AOSWP_DEMO_LIB_FILE )

