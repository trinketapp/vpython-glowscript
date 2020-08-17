(function () {
    "use strict";

/*
Salvatore di Dio demonstrated in his RapydGlow experiment (http://salvatore.pythonanywhere.com/RapydGlow)
how he was able to use the RapydScript Python-to-JavaScript compiler with GlowScript graphics.
This inspired the implementation of the VPython (vpython.org) API at glowscript.org.
Salvatore provided the file papercomp.js for operator overloading, based on the work of
    Juerg Lehni (PaperScript: http://scratchdisk.com/posts/operator-overloading).
                 https://github.com/paperjs/paper.js
    Marijn Haverbeke (Acorn.js: https://github.com/ternjs/acorn).
Supporting the VPython API in a browser was initially possible thanks to the work of
    Alexander Tsepkov (RapydScript: https://bitbucket.org/pyjeon/rapydscript) and
    Charles Law (browser-based RapydScript: http://pyjeon.pythonanywhere.com/static/rapydscript_online/index.html).

When the GlowScript project was launched in 2011 by David Scherer and Bruce Sherwood,
Scherer implemented operator overloading and synchronous code using libraries existing at that time.
In 2015 it became necessary to upgrade to newer libraries because compilation failed on some browsers.

In Jan. 2017 Bruce Sherwood updated the operator overloading (papercomp.js) machinery to use
the latest versions of the acorn and streamline libraries (until August 2019 streamline was
used to convert synchronous code to asynchronous code). He also changed from using the rapydscript
of Tsepkov to the rapydscript-ng of Kovid Goyal, which is closer to true Python and therefore
better for the purposes to which GlowScript is put.

-----------------------------------------------------------------------------------------
HOW TO OBTAIN BROWSER VERSIONS OF THE RAPYDSCRIPT-NG, PAPERCOMP, and PLOTLY
There may be more efficient ways to obtain these libraries, but the following methods work.

RAPYDSCRIPT-NG
For the rapydscript-ng in-browser Python-to-JavaScript transpiler, go to https://github.com/kovidgoyal/rapydscript-ng.
Search for "Embedding the RapydScript compiler in your webpage". There you will find a link to the transpiler file,
with instructions for how to use it. Store the file in lib/rapydscript/compiler.js.

The in-browser transpiler includes a minimized copy of the run-time function. However, for a program exported
to the user's own web page, the transpiler is not present and a run-time file is need. Here is how to build
the rapydscript-ng runtime library (but see below for an alternative procedure):
1) Make sure node is installed.
2) In a new folder, execute "npm install rapydscript-ng".
3) Create a file named "input.py" in this folder that contains "a=1".
4) Execute this (modify if not on Windows): node.exe .\node_modules\rapydscript-ng\bin\rapydscript --bare input.py > runtime.js
5) At the end of the file "runtime.js", delete these lines:
	var __name__ = "__main__";
	
	var a;
	a = 1;
6) Copy the file to lib/rapydscript/runtime.js.
For GlowScript 2.6 this resulted in runtime.js having the encoding "UCS-2 LE BOM" which the Uglify
machinery invoked by running build_original.py could not handle. Using (on Windows) notepad++
the encoding was changed to "UTF-8" which solved the problem.

The instructions above for building the two RapydScript files are adequate if it is not necessary to
get the very latest version from the rapydscript-ng repository. If there have been commits to the
repository that you want, but the key files haven't been updated, replace the instructions with the
following. I was unable to do this on Windows and did this on a Mac.

Build rapydscript-ng from source (from "Installation" section at rapydscript-ng):
1) Make sure node and git are installed.
2) In a new folder, execute the following (taken from Installation instructions in the rapydscript-ng repository):
	git clone git://github.com/kovidgoyal/rapydscript-ng.git
	cd rapydscript-ng
	sudo npm link .
	sudo npm install  # This will automatically install the dependencies for RapydScript
3) Execute "sudo bin/rapydscript self --complete --test". This will build files in the "release" folder.

Build embedded compiler: (from "Embedding the RapydScript compiler in your webpage" section at rapydscript-ng)
4) Execute "sudo bin/web-repl-export embedded". This builds the "embedded" (in-browser) compiler.

Move new files to glowscript source:
5) Copy the file dev/baselib-plain-pretty.js to lib/rapydscript and change the name to runtime.js.
6) Copy the file embedded/rapydscript.js to lib/rapydscript and change the name to compiler.js.
   If there is no ending semicolon, add a semicolon (plus a newline for clarity) to the end of this file.
7) Insert these statements at the start of runtime.js (this is a kludge; don't know how to invoke the new compiler):
	var RS_iterator_symbol = (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") ? Symbol.iterator : "iterator-Symbol-5d0927e5554349048cf0e3762a228256";
	var RS_kwargs_symbol = (typeof Symbol === "function") ? Symbol("kwargs-object") : "kwargs-object-Symbol-5d0927e5554349048cf0e3762a228256";
	var RS_cond_temp, RS_expr_temp, RS_last_exception;
	var RS_object_counter = 0;

The two rapydscript-ng files, compiler.js and runtime.js, have XY_ at the start of library entities,
where XY are non-ascii characters. This caused errors in the old streamline file (transform.js), 
so it was necessary to replace all XY characters with RS in both compiler.js and runtime.js.

Make RapydScript-NG handle vec == vec and vec != vec:
In lib/rapydscript/compiler.js, search for "function RS_equals" (two places)
and insert the following string just before "if (a === b)"
    if (a instanceof vec) {\n if (!(b instanceof vec)) return false;\nreturn (a.x === b.x && a.y === b.y && a.z === b.z);\n}\n

In lib/rapydscript/compiler.js, search for "function RS_not_equals" (two places)
and insert the following string just before "if (a === b)"
if (a instanceof vec) {\n if (!(b instanceof vec)) return true;\nreturn (a.x !== b.x || a.y !== b.y || a.z !== b.z);\n}\n
    
In lib/rapydscript/runtime.js, search for "function RS_equals"
and insert the following code just before "if (a === b)"
    if (a instanceof vec) {
    	if (!(b instanceof vec)) return false;
    	return (a.x === b.x && a.y === b.y && a.z === b.z);
    }
    
In lib/rapydscript/runtime.js, search for "function RS_not_equals"
and insert the following code just before "if (a !== b)"
    if (a instanceof vec) {
    	if (!(b instanceof vec)) return true;
    	return (a.x !== b.x || a.y !== b.y || a.z !== b.z);
    }

OPERATOR OVERLOADING
For operator overloading, the source for lib/compiling/papercomp.js is at https://github.com/paperjs/paper.js,
at src/core/PaperScript.js; compare with papercomp.js, which was modified by Bruce Sherwood for greater speed.
Also needed is a current copy of acorn (acorn.js), a parser of JavaScript used by papercomp.js.
1) Make sure node has been installed.
2) In a new folder, execute "npm install acorn".
3) The file you want is node_modules/acorn/dist/acorn.js.
4) Copy the file to lib/compiling/acorn.js
5) Modify the end of the file to look like this:

	// exports.version = version;
	// exports.parse = parse;
	etc.......
	// exports.lineBreakG = lineBreakG;
	// exports.nonASCIIwhitespace = nonASCIIwhitespace;

	//Export(exports)

	//Object.defineProperty(exports, '__esModule', { value: true });

	window.call_acorn_parse = parse // Bruce Sherwood; makes acorn accessible to GlowScript compiler

See ForInstalledPython/README.txt for how to obtain the plotly graphing library

THE ACE EDITOR
Currently glowscript.org uses a very old version of the ACE editor, with old versions of
of mode-javascript.js, worker-javascript.js, and mode-python.js. It would be good to
update them. Note that at the start of the GlowScript project in 2011, "require" was
not common, and Bruce Sherwood changed require to ace_require in the ACE files.
See lib/ace/FileSource.txt.
Here are current ACE builds: https://github.com/ajaxorg/ace-builds/
*/

/* 
STRUCTURE OF THIS FILE
The entry point is the compile() function. It calls preprocess(), which splits the user program into
individual lines of text and examines each line, inserting line numbers in the form 'RS_ls = "line number"\n'.
Such statements survive later stages in the processing, and in a final step 'RS_ls = ' is deleted.
If a run-time error occurs in a user program, untrusted/run.js searches backward from the reported
error location for the most recent "line number" and informs the user of the error location in the
original code, though currently only Chrome provides the stack trace needed to provide this feedback.

The preprocess() function also handles the Python "import" statement, which permits using all forms
(from vpython import *, from vpython import box, sphere, import vpython, import vpython as vp).

The preprocess() function identifies the names of user functions and adds them to the list "fcts"
which also includes rate, sleep, pause, waitfor, capture, get_library, and read_local_file, the seven GlowScript
functions that involve delays before returning. In a later stage all the user functions will have "async"
prepended to the function definitions and "await" will be prepended to all calls to these functions.

The preprocess() function also tracks single, double, and triple quotes, parentheses, brackets, and
braces, and uses this information to be able to give compile-time error messages about missing symbols
and where the problem is found. The positions of the beginning and end of strings are used to
identify forms such as "g()" that should not be identified as function calls. In such cases,
g() is changed to g~!#() so that in a later pass it won't be identified as a function call. At the
end of compilation all forms like g~!#() are returned to the original g() form. In f-strings
such as f'this is {g(5)}' the string is not modified.

When a Python class definition is encountered during preprocessing, the class name is appended to
the classes array. When an instance of a class is defined during preprocessing, as in q = C(a=5),
where C is a class, this line is converted to "_GS_1 = C(); _GS_1.__init__(a=5); q = _GS_1"", and
after transpiling by RapydScript the classdefinition code is processed to remove the call in C to
__init__. The reason for these manipulations is that it is not possible for a JavaScript "new"
function (old JavaScript) or the class "constructor" (new JavaScript) to use async and await,
whereas the JavaScript statement "await _GS_1.__init__({a:5})" invokes an async __init__ function.
Without these manipulations one can't have awaits in the __init__ method. If there are multiple
constructors in a statement, their temporary instance names are _GS_1, _GS_2, etc.

After preprocess() is complete, some further adjustments and additions are made to the user code and,
if the language is Python, the RapydScript-NG Python-to-JavaScript transpiler is called.

Next, operator overloading is dealt with, which transforms for example A+B to A["+"](B). In the file
lib/glow/vectors.js are modifications to the JavaScript prototypes of the Number, String, and vec
classes to handle the major binary and unary operators. The key file is lib/compiling/papercomp.js
containing the function papercompile().

After operator overloading is completed, the modified JavaScript program is searched for function
declarations and function calls, based on the information in fcts, and "function" is changed to
"async function", and if the function name is in the "fcts" list a function call is prepended
by "await " (and the entire function call including "await " is wrapped in parentheses).

At the end of this file are some final, minor adjustments, and if a text() object was included in
the program, the necessary fonts are fetched. Finally the modified program is returned to the place
where compile() was called, in untrusted/run.js.
*/

	var VPython_import = null // can be vpython or visual or vis
	var VPython_names = []    // e.g. [box, cylinder] or [] if none specified (e.g. import vpython)
	
	const classpatt = new RegExp('^class\\s+(\\w+)[^:]*:') // find a Python class
	const instpatt = new RegExp('(\\w+)\\s*\\(') // find a constructor of a Python class
	const defpatt = new RegExp('^def\\s+(\\w+)\\s*\\(')   // find a Python def
	const asyncpatt1 = new RegExp('\\Wfunction\\s*(\\w+)\\s*\\(')      // find "function f(...."
	const awaitpatt = new RegExp('\\W(\\w+)\\s*\\(')  // find a function call
	const jsasyncpatt1 = new RegExp('\\Wfunction\\s*([\\w\.]+)\\s*\\(')      // find "function f(...."
			
	// fcts is a list of GlowScript functions that need "await" and of all user functions that are not 
	//    classes, instances of classes, or methods of classes:
	var vpfcts = ['pause', 'waitfor', 'capture'] // These are preceded by "scene."
	var vpwaits = ['rate', 'sleep', 'get_library', 'read_local_file']
	var fcts = []

	// If ...name(... is encountered inside a string during the first pass, it is changed
	// to ...name+string_insert+(.... to prevent finding this apparent function or function call,
	// and one of the last tasks in compiling is to delete all occurrences of string_insert.
	const string_insert = '~!#'

	var classes =  []       // list of names of classes
	var classinstances = [] // list of instances of classes
	var classmethods = []   // list of names of methods of classes
	var delim = '"'
	
	var lineno_string = 'RS_ls = ' // prepended to quoted line number; used in error return

	function findrightparen(s) { // s is a string starting with '('; return location of matching ')' or null
		var cnt = 0
		var i = 0
		while (i < s.length) {
			var c = s[i]
			if (c == '(') cnt++
			else if (c == ')') {
				cnt--
				if (cnt === 0) return i
			}
			i++
		}
		return null
	}
	
	function preprocess(program, lang) { // manipulate the program source
		// The preprocessing includes inserting RS_ls = "line number" to enable error reporting of original source line
		if (lang == 'rapydscript') throw new Error("GlowScript RapydScript is not available after GlowScript 2.9.Choose GlowScript VPython instead.")
		//if (lang == 'javascript') throw new Error("3.0dev does not yet work with JavaScript programs.")
		if (lang == 'vpython') classinstances.push('self')
		var c, lineno, lines, line, m, start
		var singlequote, doublequote, triplequote, backquote // backquote is ` used in JavaScript
    	var parens = 0, brackets = 0, braces = 0
    	var prebraces // the braces at the start of processing a line
    	var lastleftparens = null, lastleftbracket = null, lastleftbrace = null
	    var indent = ''
    	var getline = /(^\s*)(.*)/
    	var newprogram = '', lastindent = ''
    	var continuedline = false
		var indef = false // true if processing an anonymous def in RapydScript
		var lastfct = ''  // The most recent unembedded JavaScript function; if encounter a function when braces == 1, might be a class
    	var classindent = -1 // class indent if processing a class, else -1
		const pickpatt = /(\.pick)\s*(.)/
	    var print_optionspatt = /^print_options/
		var decoration
		var lastlineno = 0
		if (lang == 'javascript') lineno_string = '  '+lineno_string
		var cline = ''
		var cindent = ''

		// Replace arange with range (RapydScript-NG's range function handles floats):
		if (lang == 'vpython') program = program.replace(/arange/g, 'range')
    	
			function instring(n) {
				for (var sb of string_bounds) {
					if (n >= sb[0] && n <= sb[1]) return true
				}
				return false
			}

		lines = program.split('\n')
		for (lineno=1; lineno<lines.length; lineno++) { // process individual lines of code; first line is GlowScript header

			decoration = ''
		    m = lines[lineno].match(getline)
			indent = m[1]
			var idt = '' // effectively, convert tabs into spaces
			for (var i=0; i<indent.length; i++) idt += ' '
			indent = idt
			line = m[2]
			if (cline != '') {
				indent = cindent
				line = cline+line
				cindent = ''
				cline = ''
			}
		    if (lang == 'vpython') {
				if (line[0] == '#') continue
		    } else { // eliminate comments
				if (line.slice(0,2) == '//') {
					lines[lineno] = ''
					continue
				} else if (line.slice(0,2) == '/*') {
					while (true) {
						if (lines[lineno].search('[*]/') >= 0) {
							lines[lineno] = ''
							break
						} else {
							lines[lineno] = ''
							lineno++
						}
					}
					continue
				}
			}
			
			line = line.replace(/\s+$/g, '') // delete trailing spaces; later check for 'a = ', which shouldn't compile to 'a = "21";' due to line number insertions
			if (lang == 'vpython' && line.slice(-1) == '\\') { // Python signls a continue line with a final backslash
				cline = line.slice(0,-1)
				cindent = indent
				continue
			}

			m = line.match(print_optionspatt)
		    if (m) line = line.replace(/delete/, "remove") // RapydScript-NG chokes on "delete"; print_options accepts delete or remove

	    	if (lang == 'vpython' && line[0] == '@') { // such as @kwargs
	    		var nextline = lines[lineno+1]
	    		m = nextline.match(getline)
	    		if (m[2].slice(0,3) == 'def' || m[2].slice(0,6) == 'module') {
	    			decoration = line
	    			indent = m[1]
	    			line = m[2]
	    			lineno++
	    		} else {
	    			continue
	    		}
	    	}
		    
		    if (line.length === 0) continue
		    prebraces = braces
			
			if (lang == 'vpython') {
			    if (classindent === indent.length) classindent = -1
				if (line.match(classpatt)) classindent = indent.length
		    } else {
				line = '  '+line // simplify use of RegExp patters that work with Python
		    }

			var w = line.split(' ')
			if (lang == 'vpython' && w.indexOf('import') > -1) { // handle VPython import statements
		    	// 'from vpython import *'  // this is the default (or 'from visual import *')
	    		// 'from vpython import canvas, box, vec': VPython_names = [canvas, box, vec], MUST include canvas
	    		// 'import vpython' // create vpython = {box:vp_box, sphere:vp_sphere, etc.}
				// 'import vpython as vp'
				
				if (w.indexOf('random') > -1) { // let RapydScript-NG deal with importing random
					newprogram += '  '+indent+line+'\n'
					continue
				}

				if (VPython_import === null) VPython_names = []
				if (w[1] == '__future__') continue
				if (w[1] == 'visual.factorial') continue
	    		if (w[0] == 'from' && w[2] == 'import' && w.length >= 4) { // from X import a, b, c (or *)
	    			if (w[1] == 'visual.graph') {
	    				if (w[3] == '*') continue // from visual.graph import * is the only graph import supported at the moment
	    				return 'ERROR: Currently only "from visual.graph import *" is supported, line '+(lineno+2)+": "+lines[lineno]
	    			}
	    			if (!(w[1] == 'vpython' || w[1] == 'visual' || w[1] == 'vis')) {
	    				throw new Error("Line "+(lineno+1)+": cannot import from "+w[1])
	    			}
	    		    if (VPython_import === null) {
	    		    	if (w[3] == '*') continue // from vpython import * is the default
	    		    	VPython_import = w[1]
	    		        for (var j=3; j<w.length; j++) {
	    		            if (w[j].length > 0 && w[j] != ',') {
	    		                if (w[j].slice(-1) == ',') w[j] = w[j].slice(0,-1)
	    		                if (w[j] == ' ' || w[j] == '(' || w[j] == ')' || w[j][0] == '(' || w[j][-1] == ')') continue
	    		                VPython_names.push(w[j])
	    		            }
	    		        }
	    		    	if (VPython_names.indexOf('canvas') == -1) VPython_names.push('canvas')
	    		    }
	    		    continue
	    		} else if (w[0] == 'import' && w.length == 2) { // import X
	    			if (w[1] == 'visual.graph') return 'ERROR: Currently only "from visual.graph import *" is supported, line '+(lineno+1)+": "+lines[lineno]
	    			if (!(w[1] == 'vpython' || w[1] == 'visual' || w[1] == 'vis')) 
	    				return "ERROR: Cannot import from "+w[1]+", line "+(lineno+1)+": "+lines[lineno]
	    		    if (VPython_import === null) {
	    		    	VPython_import = w[1]
	    		    }
	    		    continue
	    		} else if (w[0] == 'import') { // import vpython (or visual or vis), or import vpython as vp
	    			if (w[1] == 'vpython' || w[1] == 'visual' || w[1] == 'vis') {
	    				if (w.length == 4 && w[2] == 'as') {
	    					VPython_import = w[3] // import vpython as vp
	    					continue
	    				} else return "ERROR: improper import statement, line "+(lineno+1)+": "+lines[lineno]
	    			} else {
	    				return "ERROR: Cannot import from "+w[1]+", line "+(lineno+1)+": "+lines[lineno]
	    			}
	    		}
			} // end handle VPython import statements
		    
			// Handle single ('), double ("), and triple (''' or """) quotes; also count parens, brackets, and braces
			singlequote = false
			doublequote = false
			triplequote = false // true if in the midst of """......"""
			backquote = false // ` used in JavaScript
			var backslash = false
			var string_bounds = [] // elements are [start,end, ftype] bounds on strings encountered in the line
	    	var previouscontinuedline = continuedline
			var processedtriplequote = false
			var fstring = false // true if f'string or F'string
			for (var i=0; i<line.length; i++) { // inspect each character in the line
				var previousquote = singlequote || doublequote || triplequote
	    		// If there are triple quotes we stay in this loop to collect the entire string
	    		var char = line[i]
	    		if (char == '\\' && i < line.length-1 && line[i+1] !== ' ') { // handle e.g. \"
	    			i++
	    			continue
	    		}
	    		switch (char) {
		    		case '#':
		    			if (lang == 'javascript') break
		    			if (!singlequote && !doublequote && !triplequote) { // remove trailing comments
								line = line.slice(0,i)
								line = line.replace(/\s+$/g, '') // remove now-trailing spaces
		    			}
		    			break
					case '/':
						if (lang == 'vpython') break
						if (line[i+1] == '/' && !singlequote && !doublequote) { // remove trailing comments
								line = line.slice(0,i)
								line = line.replace(/\s+$/g, '') // remove now-trailing spaces
						}
						break
		    		case "'":
		    		case '"':
						if (!singlequote && !doublequote && ! triplequote && i !== 0 && (line[i-1] == 'f' || line[i-1] == 'F'))
							fstring = true
						if (i <= line.length-3 && line[i+1] == char && line[i+2] == char) { // ''' or """
							if (lang == 'javascript') throw new Error("JavaScript doesn't recognize triple quotes.")
							if (!triplequote) string_bounds.push([i,0, fstring])
							else string_bounds[string_bounds.length-1][1] = i
		    				triplequote = !triplequote
		    				processedtriplequote = true
		    				i += 2
		    			} else if (char == "'") {
		    					if (!doublequote && !triplequote) {
									if (!singlequote) string_bounds.push([i,0, fstring])
									else string_bounds[string_bounds.length-1][1] = i
									singlequote = !singlequote
								}
						} else if (char == '"') { // "
							if (!singlequote && !triplequote) {
								if (!doublequote) string_bounds.push([i,0, fstring])
								else string_bounds[string_bounds.length-1][1] = i
								doublequote = !doublequote
							}
						} else if (char == "`") { // ` used in JavaScript
							if (backquote) backquote = !backquote
						}
		    			break
				}


	    		if (triplequote && i == line.length-1 && lineno < lines.length-1) {
					lineno++
					// this extends the surrounding for loop with "i" at the start of the original next line:
	    			line += '\n' + lines[lineno]
	    		}
	    		if (singlequote || doublequote || triplequote || (backquote && lang == 'javascript') ) {
	    			if (i < line.length-1) continue
	    			if (lineno === lines.length-1) {
	    				var q = "single"
						if (doublequote) q = "double"
						else if (triplequote) q = "triple"
						else q = "backquote"
	    				return "ERROR: Unbalanced "+q+" quotes, line "+(lineno+1)+": "+lines[lineno]
	    			}
	    		}
				
	    		switch (char) {
		    		case ':':
		    			if (parens == 1 && braces === 0 && brackets === 0) { // anonymous function (':' not found in a dictionary)
		    				indef = true
		    			}
		    			break
		    		case '(':
		    			if (i > 0 && line[i-1] == '\\') break // check for \( in a regular expression
		    			if (parens === 0) lastleftparens = lineno
		    			parens++
		    			break
		    		case ')':
		    			if (i > 0 && line[i-1] == '\\') break // check for \) in a regular expression
		    			parens--
		    			if (indef && parens == 0) indef = false
		    			break
		    		case '[':
		    			if (i > 0 && line[i-1] == '\\') break // check for \[ in a regular expression
		    			if (brackets === 0) lastleftbracket = lineno
		    			brackets++
		    			break
		    		case ']':
		    			if (i > 0 && line[i-1] == '\\') break // check for \] in a regular expression
		    			brackets--
		    			break
		    		case '{':
		    			if (i > 0 && line[i-1] == '\\') break // check for \{ in a regular expression
		    			if (braces === 0) lastleftbrace = lineno
		    			braces++
		    			break
		    		case '}':
		    			if (i > 0 && line[i-1] == '\\') break // check for \} in a regular expression
		    			braces--
						break
	    		}
	    		if (char == '\\') {
					if (i == line.length-1 || line[i+1] == ' ' || line[i+1] == '#')
		    			line = line.slice(0,i)
		    			backslash = true
		    			break
	    		}
			}  // End of handling single, double, triple, and back quotes, and counting parens, brackets, and braces

			continuedline =  ( !indef && (backslash || (parens > 0) || (brackets > 0) || (braces > 0)) )
    		
		    if (!previousquote) {
		    	if (lang == 'vpython') {
			    	var m = pickpatt.exec(line+' ') // convert v.pick -> v.pick()
			    	if (m) {
			    		if (m[2] != '(' && (m[2].search(/\w/) != 0)) {
							var i = m.index
			    			line = line.slice(0,i)+'.pick()'+line.slice(i+5)
			    		}
			    	}
		    	}
			} // end if !previousquote

			function instring(n) {
				for (var sb of string_bounds) {
					if (n >= sb[0] && n <= sb[1] && !sb[2]) return true
				}
				return false
			}
    		
    		if (lang == 'vpython') {
			    // When outdent line starts with ')', the element 'RS_ls = "N"' must be indented.
			    // When outdent line starts with 'else' or 'elif', at the same level as prevous line,
			    //   don't insert a line number; it's this case:
			    //     if a: b
			    //     elif c: d
			    //     else e: f
				// Similarly, if outdent line starts with except or finally, don't insert a line number
				
				c = ''
			    if (indent.length < lastindent.length && ( line[0] == ')' || 
						line.substr(0,2) == 'if' ||
			    		line.substr(0,4) == 'else' ||
			    		line.substr(0,4) == 'elif' ||
			    	    line.substr(0,6) == 'except' || 
			    	    line.substr(0,7) == 'finally') ) {
			    	c = lastindent+lineno_string+delim+(lineno+1)+delim+'\n'
			    } else c = indent+lineno_string+delim+(lineno+1)+delim+'\n'
			    
		    	if (indent.length == lastindent.length && (line.substr(0,4) == 'elif' || line.substr(0,4) == 'else')) {
		    		c = ''
		    	} else if (line.substr(0,3) == '"""' || line.substr(0,3) == "'''" || line[0] == ')') {
		    		c = ''
		    	}
			    
				if (line[line.length-1] == '=') return 'ERROR: Line '+(lineno+1)+" ends with equal sign: "+lines[lineno]
				
	
				// need to indent the entire program two spaces
				var prepend = ''
				if (previouscontinuedline) {
					prepend = indent
					indent = lastindent // keep the indent of the starting line of this continued sequence
				} else if (c == '') {
					prepend =  '  '+indent 
				} else {
					if (decoration.length > 0) {
						prepend =  '  '+c+'  '+indent+decoration+'\n'
						prepend =  '  '+indent
					} else {
						prepend =  '  '+c+'  '+indent
					}
				}

				// Check whether this line contains function calls inside strings, which will not need "await"
				start = 0
				while (true) {
					// const awaitpatt = new RegExp('\\W(\\w+)\\s*\\(')  // find a function call
					var m = line.slice(start).match(awaitpatt)
					if (m !== null) {
						start += m.index
						var ins = instring(start)
						if (ins) {
							line = line.slice(0,start+1+m[1].length) + string_insert + line.slice(start+1+m[1].length)
							start += string_insert.length
						}
						start += m[1].length+1
					} else break
				}

				var start = 0
				var inst, cls, m1=null, m2=null, m3=null, m4=null, m5=null, m6=null, m7=null, m8=null
				var declaration = false
				var pre = ''      // accumulate instances of classes; instances are named _GS_1, _GS_2, etc.
				var newline = ''  // accumulate modified line, such as q = _GS_1
				const methodassignpatt = new RegExp('^(\\w+)\\s*=\\s*(\\w+)\\.(\\w+)$') // p = xxx.yyy (not a call)
				const assignpatt = new RegExp('^(\\w+)\\s*=\\s*(\\w+)\\s*')                // p = anything else
				m1 = line.match(defpatt)                           // Python def f():, can be a class method
				if (m1 === null) m2 = line.match(classpatt)        // Python class C:
				if (m2 === null) m3 = line.match(methodassignpatt) // Python p = xxx.yyy
				if (m3 === null) m4 = line.match(assignpatt)       // Python p = anything else

				// Check whether this line contains a function declaration, which will need "async"
				if (m1 !== null) { // function declaration; can be a class method
					var ns = start+m1.index+m1[1].length+1
					if (instring(ns)) { // string_bounds was determined for the original line (no indent, no inserted line number)
						line = line.slice(0,ns) + string_insert + line.slice(ns)
					} else {
						if (indent.length === 0 || classindent === -1) fcts.push(m1[1])
						else if (classindent >= 0 && indent.length > classindent) classmethods.push(m1[1])
					}
					declaration = true

				} else if (m2 !== null) { // class declaration, which is not async; its methods are async
					classes.push(m2[1])
					declaration = true

				} else if (m3 !== null) { // p = xxx.yyy (not a call)
					if (classinstances.indexOf(m3[2]) >= 0 && classmethods.indexOf(m3[3]) >= 0) classmethods.push(m3[1])

				} else if (m4 !== null) { // p = f, where f might be a function
					var p = m4[1]
					var f = m4[2]
					if (line[m4[0].length] == '(') { // p = f(...
						var end = findrightparen(line.slice(m4[0].length))
						if (end !== null && (m4[0].length+end+1 == line.length)) {
							if (classes.indexOf(f) >=0) classinstances.push(p)
							else if (classmethods.indexOf(f) >= 0) classmethods.push(p)
							else if (fcts.indexOf(f) >= 0) fcts.push(p)
						}
					}
				}

				start = 0
				const bindmethodpatt = new RegExp('(\\w+)\\.(\\w+)\\s*')
				while (true) { // convert all classinstance.classmethod without parens to classinstance.classmethod.bind(classinstance)
					m = line.slice(start).match(bindmethodpatt)
					if (m === null) break
					if (classinstances.indexOf(m[1]) >= 0 && classmethods.indexOf(m[2]) >= 0 && 
								(start+m.index+m[0].length >= line.length || line[start+m.index+m[0].length] != '(')) {
						line = line.slice(0,start+m.index)+line.slice(start+m.index).replace(m[2], m[2]+'.bind('+m[1]+')')
						start += m.index+m[0].length+m[1].length+7
					} else start += m.index+m[0].length
				}

				if (!declaration) { // not function declaration nor class declaration
					const leftpatt = new RegExp('^(\\w+)\\s*=\\s*') // find p = .....
					var left = null, right = line
					m = line.match(leftpatt)
					if (m !== null) {
						left = m[1] // left = ....
						right = line.slice(m[0].length)
					}
					start = 0
					var n = 0 // counts number of class constructors on this line, named _GS_1, _GS_2, etc. else { // Not a function or class declaration:						
					while (true) { // Look through the line for class constructors
						// Handle calls to classes. For example, q = C(a=5) is converted to
						//        _GS_1 = CC(); _GS_1.__init__(a=5); q = _GS_1
						// Currently does not deal with constructors that have arguments that are constructors (needs recursion)
						// const instpatt = new RegExp('(\\w+)\\s*\\(') // look for a constructor of a Python class
						m = line.slice(start).match(instpatt)
						if (m === null) {
							if (pre.length > 0) newline += line.slice(start)
							break
						}
						cls = m[1]
						var leftparen = start+m.index+m[1].length // location of left paren of C(....)
						if (classes.indexOf(cls) >= 0) {
							var p = 1 // parens level
							var i = leftparen+1
							while (true) { // search for corresponding right paren
								var char = line[i]
								if (char == '(') p += 1
								else if (char == ')') {
									p -= 1
									if (p === 0) break
								}
								i += 1
								if (i > line.length) break
							}
							if (i > line.length) break
							n += 1
							pre += '_GS_'+n+' = '+cls+'(); _GS_'+n+'.__init__'+line.slice(leftparen,i+1)+'; '
							newline += line.slice(start,leftparen-m[1].length)+'_GS_'+ n
							start = i+1
						} else { // encountered f(...) where f is not a class
							newline += line.slice(start,leftparen)
							start = leftparen
						}
					}
				}
				if (pre.length > 0) line = pre + newline
				
				const inputpatt = new RegExp('input\\s*\\(')
				// input() and winput() need sleep(0.1) prepended, to ensure canvas is updated
				m = line.match(inputpatt)
				if (m !== null) {
					let ok = true
					let pre = m.index-1
					if (pre >= 0) {
						let p = line[pre]
						ok = (p == 'w' || p == '.' || p == ' ' || p == '=')
					}
					if (ok) newprogram += '  '+indent+'sleep(0.1)'
				}

				newprogram += prepend+line+'\n'

			} // end of vpython procesing of class and function issues
				
			// Give up for now introducing line numbers into a JavaScript program; would need to check for example
			// (as is done for Python) not to put a line number between an if and an else if.


		    lastindent = indent
		    if (parens < 0) return "ERROR: Too many right parentheses, line "+(lineno+1)+": "+lines[lineno]
		    if (brackets < 0) return "ERROR: Too many right brackets, line "+(lineno+1)+": "+lines[lineno]
			if (braces < 0) return "ERROR: Too many right braces, line "+(lineno+1)+": "+lines[lineno]
		} // end of processing individual lines of code
    	
    	if (parens > 0) return "ERROR: Missing right parenthesis, see line "+(lastleftparens+2)+": "+lines[lastleftparens]
	    else if (brackets > 0) return "ERROR: Missing right bracket, see line "+(lastleftbracket+2)+": "+lines[lastleftbracket]
		else if (braces > 0) return "ERROR: Missing right brace, see line "+(lastleftbrace+2)+": "+lines[lastleftbrace]
		
		return newprogram
    } // end of preprocess

    var linenopatt = /"(\d*)"/

    var RS_compiler

    function compile_rapydscript(rs_input) {
	    if (rs_input.slice(0,7) == 'ERROR: ') {
	    	throw new Error(rs_input.slice(7))
    	} else {
    	    if (RS_compiler === undefined) RS_compiler = RapydScript.create_embedded_compiler()
	        rs_input += '\n' //just to be safe
	        try {
				var output = RS_compiler.compile(rs_input, {js_version:6}) // "6" means ES6
				return output.toString()
	        } catch(err) {
		        if (err.line === undefined) {
		        	throw new Error(err.message)
		        } else {
		    	    var lines = rs_input.split('\n')
					var L = lines[err.line-1] // the text of the error line
		    	    var m = L.match(linenopatt) // may be '  "23"', inserted by insertLineNumbers()
		    	    if (m !== null) {
		    	    	throw new Error(err.message + "; line " + m[1] + ": "+lines[err.line])
		    	    } else {
						let ln = lines[err.line-2] // Should have the form RS_ls = "2"
						let n = ln.search('"')
						if (n >= 0) throw new Error(err.message +' at line '+ln.slice(n+1,ln.length-1)+': '+L)
						else throw new Error(err.message +': '+L)
		    	    }
		        }
	      	}
		}
    }

    var vp_primitives = ["box", "sphere", "simple_sphere", "cylinder", "pyramid", "cone", "helix", "ellipsoid", "ring", "arrow", "compound"]
    
    var vp_other = ["canvas", "vec", "vector", "rate", "sleep", "update", "color", "extrusion", "paths", "shapes",
                    "vertex", "triangle", "quad", "label", "distant_light", "local_light", "attach_trail", "attach_arrow",
                    "sqrt", "pi", "abs", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "exp", "log", "pow",
                    "factorial", "combin", "button", "radio", "checkbox", "slider", "checkbox", "text",
                    "radians", "degrees", "get_library", "read_local_file"]
    
	function compile(program, options) { // program now includes first line (GlowScript X.Y VPython/JavaScript)
		// options include lang ('javascript' or 'vpython'), version,
		//     run (true if will run the code, false if compiling for sharing, in which case don't call fontloading)
		options = options || {}
		window.__original = {text: program.split("\n")}
		window.__GSlang = options.lang
        var version = '["'+options.version+'", "glowscript"]' // e.g. ['1.1', 'glowscript']
        
        // Look for text object in program
    	// findtext finds "...text  (....." and findstart finds "text  (...." at start of program
        var findtext = /[^\.\w]text[\ ]*\(/
        var findstart = /^text[\ ]*\(/
    	var loadfonts = findtext.exec(program)
        if (!loadfonts) loadfonts = findstart.exec(program)
        
        // Work around the problem that .delete is not allowed in JavaScript; for API need d = canvas() .... d.delete() to delete canvas:
        program = program.replace(/\.delete/g, ".remove")
        
        function pop_replace(m, p1, p2) {
        	if (p2.length === 0) return m
        	else return '.py'+m.slice(1)
		}
		
		var endprog
        if (options.lang == 'vpython') { 
			program = preprocess(program, options.lang)
    		var vars = ''
        	if (program.slice(0,7) == 'ERROR: ') {
        		compile_rapydscript(program)
        	} else {// handle Python imports
				var prog
				// if pop(), leave as is to work ok with both lists and sets, but if pop(N), which is only found with lists, use pypop(N)
				program = program.replace(/(\.pop\s*\(\s*)([^)]*)/g, pop_replace)
				program = program.replace(/\.sort\s*\(/g, '.pysort(')  // Make sort equivalent to pysort (RapydScript python-like sort)
				prog = "def __main__():\n  version = "+version+"\n"
				// The following turned out to slow all calculations down by about a factor of 5 and so was abandoned:
				//prog += "  from __python__ import dict_literals, overload_getitem\n" // so that dictionaries behave like Python dictionaries
				prog += "  window.__GSlang = 'vpython'\n" // WebGLRenderer needs to know at run time what models to create
				if ( VPython_import === null) {
					prog += "  display=canvas\n  vector=vec\n"
				} else if (VPython_names.length > 0) { // e.g from vpython import box, cylinder
					vars += "  vector=vec\n"
					for (var i=0; i<vp_primitives.length; i++) {
						var name = vp_primitives[i]
						var n = VPython_names.indexOf(name)
						if (n >= 0) vars += "  "+name+"="+name+"\n"
						else vars += "  "+name+"=undefined\n"
					}
					var hasvector = (VPython_names.indexOf('vector') >= 0)
					for (var i=0; i<vp_other.length; i++) {
						var name = vp_other[i]
						if (name == 'vec' && hasvector) continue
						var n = VPython_names.indexOf(name)
						if (n < 0) vars += "  "+name+"=undefined\n"  // just undefine those entities not listed in the import; those listed need no mention
					}
					prog += vars
				} else { // import vpython or visual or vis, or import vpython or visual or vis as (VPython_import)
					var importpatt = new RegExp(VPython_import+'\\.(\\w+)', 'g')
					var m = program.match(importpatt) // has the form [vis.vector, vis.rate, vis.vector, .....]
					importpatt = new RegExp(VPython_import+'\\.(\\w+)')
					var attrs = {} // a dictionary containing all the objects referenced in the program
					for (var i=0; i<m.length; i++) {
						var a = importpatt.exec(m[i])[1] // extract "rate" from "vis.rate" or "visual.rate"
						if (!(a in attrs)) attrs[a] = a
					}
					var purge = '' // set variables unqualified by vis. or visual. to "undefined"
					vars += '    var '+VPython_import+'={'
					for (var i=0; i<vp_primitives.length; i++) {
						var name = vp_primitives[i]
						if (name in attrs) vars += name+':'+name+', '
						else purge += "  "+name+'=undefined\n'
					}
					vars += 'canvas:canvas, abs:abs, ' // abs is a builtin Python function; needs special treatment
					for (var i=0; i<vp_other.length; i++) {
						var name = vp_other[i]
						if (name == 'canvas') continue
						if (name in attrs) {
							if (name == 'vector') vars += 'vector:vec, '
							else vars += name+':'+name+', '
						} else {
							if (name == 'vec' && ('vector' in attrs)) continue
							if (name = 'abs') continue
							purge += "  "+name+'=undefined\n'
						}
					}
					vars = vars.slice(0,-2)+'}\n'
					prog += purge
				}
				prog += "  print = GSprint\n"
				prog += "  arange = range\n"
				prog += "  __name__ = '__main__'\n" // handles common Python test: if __name__ == '__main__':
				prog += "  type = pytype\n" // override RapydScript type() function
				if (VPython_import === null || VPython_names.length > 0) prog += "  scene = canvas()\n"
				else prog += "  scene = "+VPython_import+".scene = canvas()\n"
				
				prog += "  from pythonize import strings\n"
				prog += "  strings()\n"
				endprog = prog.length
				prog += program
				
				program = compile_rapydscript(prog)
	        	var start = program.indexOf('window.__GSlang')
	        	var arr = "Array.prototype['+'] = function(r) {return this.concat(r)}\n" // adding Python lists
        		arr += "    Array.prototype['*'] = function(r) {return __array_times_number(this, r)}\n" // multiplying Python list times number
	        	if (VPython_names.length <= 0) arr += vars
				program = program.slice(0,start) + arr + program.slice(start-4)
			} // end handle Python imports
        	
		} else { // JavaScript
			let s = program.search('\n')
			if (s < 0) throw new Error("Missing GlowScript X.Y initial line.")
			program = program.substr(s+1) // Remove GlowScript line
            //var p = 'async function __main__() {\n"use strict";\n'
			//var p = 'async function __main__() {\n'
			var p = 'function __main__() {\n'
            p += "var version = "+version+";\n"
            	
            // This string formatting machinery was originally used by both Python and JavaScript,
            // but with the change to rapydscript-ng, which has its own format method, Python uses
            // the rapydscript-ng method, and the following is used only by JavaScript programs.
			p += "Array.prototype.toString = function() { return __parsearray(this) };\n"
			
			p += "var scene = canvas();\nvar vector = vec;\n"
			program = p + program + "\n}"
		}

		program = program.replace('function __main__() {', 'async function __main__() {\n"use strict";\n')
		
		// handle operator overloading
		var start = program.indexOf("async function __main__()")
		var prog = program.slice(start)
		prog = papercompile(prog)
		prog = program.slice(0,start)+prog
		prog = ';\n'+prog // so don't have to make special checks when searching backwards

		// ------------------- Handle async and await issues ------------------------
	
		// Must delete class statements of the form classname.prototype.RS_ls = "11";
		// which RapypdScript reduces to classname.prototype."11";
		if (options.lang == "vpython") {
			const classproto = new RegExp('\\w+\\.prototype\\.'+lineno_string+'"\\w+";', 'g')
			prog = prog.replace(classproto, '')
		
			var start, m, name
			var initialstart = prog.search(lineno_string)
			start = initialstart

			// Prepend 'async ' to all user functions
			while (true) {
				// const asyncpatt1 =   new RegExp('\\Wfunction\\s*(\\w+)\\s*\\(')      // find "function f(...."
				// const jsasyncpatt1 = new RegExp('\\Wfunction\\s*([\\w\.]+)\\s*\\(')      // find "function f(...."
				if (options.lang == 'vpython') m = prog.slice(start).match(asyncpatt1)
				// else m = prog.slice(start).match(jsasyncpatt2)
				m = prog.slice(start).match(asyncpatt1)
				if (m === null) break
				name = m[1]
				if (classes.indexOf(name) >= 0) { // A class is not async; its methods are
					start += m[0].length
					continue
				}				
				prog = prog.slice(0,start+m.index+1)+'async function '+name+string_insert+prog.slice(start+m.index+m[0].length-1)
				start += m.index+'async function '.length+m[1].length+string_insert.length+1
			} // end of prepending 'async' to user functions
				
			// Prepend "await " to calls to user functions and the GlowScript async functions (all user functions and class methods are marked async).
			start = initialstart
									
			// VPython_import is the prefix of VPython objects, with value 'null' if no import statement
			// const awaitpatt = new RegExp('\\W(\\w+)\\s*\\(')  // find a function call
			while (true) {
				m = prog.slice(start).match(awaitpatt)
				var period = false
				if (m === null) break
				period = (prog[start+m.index] == '.')
				name = m[1]

				// If this is a class, delete the call to __init__ (we will insert this call after creating the class instance)
				if (options.lang == 'vpython' && !period && classes.indexOf(name) >= 0) {
					start += m.index+name.length+1
					var lbrace = prog.slice(start).search('{')
					var rbrace = prog.slice(start).search('arguments')
					prog = prog.slice(0,start+lbrace+1)+prog.slice(start+'arguments'.length+rbrace+1)
					continue
				}

				// Might start with 'RS_' or be "....".option(...)
				//if ( name.slice(0,3) == 'RS_' || (period && (prog[start+m.index-1] == '"'))  ) {
				if ( name.slice(0,3) == 'RS_') {
					start += m.index+name.length+1
					continue
				}

				// find the beginning of ....f()
				var ptr = start+m.index+1
				var brackets = 0
				var parens = 0
				while (true) {
					ptr--
					if (prog[ptr] == ']') {
						brackets--
					} else if (prog[ptr] == '[') {
						if (brackets === 0) break
						brackets++
					} else if (prog[ptr] == ')') {
						parens--
					} else if (prog[ptr] == '(') {
						if (parens === 0) break
						parens++
					}
					if (prog[ptr] == ' ') {
						if (brackets === 0 && parens === 0) break
					}
				}
				
				var pstart = ptr+1 // start of ....f()
				var prefix = ''
				if (period) {
					prefix = prog.slice(pstart,start+m.index)
				}
				// RapydScript-NG leaves string.replace unchanged from JavaScript, so for
				// VPython we invoke string.__GSrep(), implemented in vectors.js, to mimic Python:
				if (options.lang == 'vpython' && period && classinstances.indexOf(prefix) < 0 && name == 'replace') {
					prog = prog.slice(0,start+m.index+1) + '__GSrep' + prog.slice(start+m.index+name.length+1)
					start += m.index+name.length+1
					continue
				}

				// Python and VPython and JavaScript key words that can precede '(':
				var no_await = ['if', 'elif', 'return', 'for', 'while', 'function', 'else', 'dict', 'str',
					'float', 'hex', 'int', 'iter', 'len', 'list', 'vec', 'vector', 'catch',
					'oct', 'ord', 'print', 'range', 'arange', 'update', 'print', 'GSprint', 'clock', 'msclock',
					'canvas', 'graph', 'gcurve', 'gdots', 'gvbars', 'ghbars', 'rotate', 'box', 'cylinder',
					'cone', 'pyramid', 'sphere', 'simple_sphere', 'arrow', 'curve', 'points', 'paths',
					'shapes', 'helix', 'ring', 'compound', 'vertex', 'triangle', 'quad', 'label', 
					'distant_light', 'local_light', 'attach_trail', 'attach_arrow', 'text', 'extrusion',
					'wtext', 'winput', 'radio', 'checkbox', 'button', 'slider', 'menu', 'input',
					'mag', 'mag2', 'norm', 'hat', 'dot', 'cross', 'proj', 'diff_angle', 'GS_power',
					'abs', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'exp', 'log', 'pow', 'sqrt', 
					'ceil', 'floor', 'sign', 'round', 'max', 'min', 'random', "factorial", "combin"]

				// Python and VPython key words that can be preceded by 'xxx.'
				// 'defineProperties' is a RapydScript-NG element.
				// slice is part of the RapydScript-generated JavaScript for list comprehensions.
				var no_await2 = ['remove', 'select', 'append_to_title', 'append_to_caption', 'bind', 'unbind', 'call', 'append',
								'rgb_to_hsv', 'hsv_to_rgb', 'mag', 'mag2', 'norm', 'hat', 'rotate', 'random', 'pow', 'equals',
								'format', 'trigger', 'follow', 'defineProperties', 'textures', 'bumpmaps', 'slice']

				// If not a user function, nor pause/waitfor/rate/sleep/read_local_file/get_library,
				// nor prefix is VPython_import, don't prepend await to this function call.
				// There is a risk of prepending await unecessarily. If there is a user method "F" and
				// and a user method "rotate", and there is a box named "B", then "B.rotate()" will be
				// prepended by await, which is unnecessary (but not horribly expensive). This has to
				// be tolerated: Suppose the user says "for obj in objects: obj.rotate(...)"; it would
				// be difficult in the transpiling to know whether "obj" is a user object or a VPython object,
				// both of which have rotate methods, but only the user object needs await.
				if ( // Test for cases that need await:
					(period && prefix == 'self') ||                                                // in self.f, f may be a function passed to __init__
					(!period && fcts.indexOf(name) >= 0) ||                                        // f()
					(period && classes.indexOf(prefix) >= 0 && classmethods.indexOf(name) >= 0) || // userclass.usermethod()
					(!period && classmethods.indexOf(name) >= 0) ||                                // usermethod(), preceded by usermethod = userclass.method()
					(!period && classes.indexOf(name) >= 0) ||                                     // userclass()
					(period && classinstances.indexOf(prefix) < 0 && vpfcts.indexOf(name) >= 0) || // not a user class; scene.pause(), scene.waitfor(), scene.capture()
					(period && prefix === VPython_import && vpwaits.indexOf(name) >= 0) ||         // vp.rate/vp.sleep/vp.get_library/vp.read_local_file
					(period && no_await2.indexOf(name) < 0) ||                                     // scene.bind()
					(!period && no_await.indexOf(name) < 0) ||                                     // cos()
					(!period && no_await.indexOf(name) < 0 && no_await2.indexOf(name) < 0 &&
								fcts.indexOf(name) < 0)) {                                         // probably a user function has been passed to a function
					;
				} else {  // probably no need to prepend await
					if (period && prefix == 'RS_interpolate_kwargs' && name == 'call') { // RS_interpolate_kwargs.call(this, f, ....)
						let end = prog.slice(start+m.index).search('\n')
						if (end < 0) end = prog.length - (start+m.index)
						let thisline = prog.slice(start+m.index,start+m.index+end)
						let p = thisline.indexOf('concat(')
						const callpatt = new RegExp('\\s*\\(\\s*([^,]*),\\s*([^,]*)')
						let n = thisline.match(callpatt)
						name = n[1] // can be 'this' or a function f
						let name2 = n[2]
						period = name2.indexOf('.')
						let prefix2 = ''
						if (period > 0) {
							let i = name2.length-1
							while (i > 0) {
								if (name2[i] == '.') break
								i -= 1
							}
							prefix2 = name2.slice(0,i)
							name2 = name2.slice(i+1)
							period = true
						} else period = false
						if (name == 'this') name = name2
						if (
							(name.slice(0,4) == '_GS_') ||                                                       // this occurs in calling a class __init__ function
							(!period && fcts.indexOf(name) >= 0) ||                                              // f()
							(!period && classmethods.indexOf(name) >= 0) ||                                      // usermethod(), preceded by usermethod = userclassinstance.method()
							(!period && classes.indexOf(name) >= 0) ||                                           // userclass()
							(period && prefix2 == 'self') ||                                                     // in self.f, f may be a function passed to __init__
							(period && classinstances.indexOf(name) >= 0 && classmethods.indexOf(name2) >= 0) || // userclassinstance.usermethod()
							(period && classinstances.indexOf(name) < 0 && vpfcts.indexOf(name2) >= 0) ||        // scene.pause(), scene.waitfor(), scene.capture()
							(period && classes.indexOf(name) >= 0 && classmethods.indexOf(name2) >= 0)           // userclass.classmethod()
						) {
							prog = prog.slice(0,start+m.index-prefix.length) + 'await '+prog.slice(start+m.index-prefix.length)
							if (p == -1) start += m.index+n.index+7
							else start += m.index+n.index+p+14
							continue
						} else {
							if (p >= 0) start += m.index+p
							else start += m.index+n.index+5
							continue
						}
					} else if (VPython_import !== null && !period && name == 'abs') { // abs is a builtin Python function
						prog = prog.slice(0,start+m.index+1)+VPython_import+'.'+name+prog.slice(start+m.index+name.length+1)
						name += VPython_import+'.'
						start += m.index+name.length+1
						continue
					} else {
						start += m.index+name.length+1
						continue
					}
				}

				if (prefix === VPython_import && (fcts.indexOf(name) >= 4) ) {
					// not one of vp.rate/vp.sleep/vp.get_library/vp.read_local_file
					start += m.index+name.length+1 
					continue
				}

				if (prefix == 'Object') { // inserted by RapydScript
					start += m.index+name.length+1
					continue
				}

				// Ignore function calls that are inserted by the RapydScript-NG transpiler:
				if (prog.slice(pstart,start+m.index).search('RS_') >= 0) {
					start += m.index+name.length+1
					continue
				}

				// find the end of f(.....)
				var temp = start+m.index+name.length+1
				var pend = findrightparen(prog.slice(temp))
				pend += temp

				prog = prog.slice(0,pstart)+'(await '+prog.slice(pstart,pend)+')'+prog.slice(pend)
				start += m.index+name.length+7
			} // end of adding "await " to function calls
		} // end of processing VPython class and function issues

		program = prog.replace(/\n\n\n\n/g, '') // eliminate lots of white space

		// Reduce RS_ls = "4" to "4" (specifying original line number in output for error return purposes)
		program = program.replace(new RegExp(lineno_string, 'g'), '')
		// Next, delete the remnants that are left of lineno_string:
		program = program.replace(new RegExp('\\n\\s*var RS_ls;', 'g'), '')

		// Delete the string inserts of function-like elements of strings:
		program = program.replace(new RegExp(string_insert, 'g'), '')

		program = program.replace(/Math.pow/g, 'GS_power') // enable checking for trying to take a vec to a power
		
		if (loadfonts) { // if text object is in user program
        	var s = "scene = canvas();\n"
            var sc = program.indexOf(s) + s.length
        	s = "    fontloading();\n    await waitforfonts();\n"  // wait for font files
            program = program.slice(0,sc)+s+program.slice(sc,program.length)
		}

        // var p = program.split('\n')
		// for (var i=0; i<p.length; i++) console.log(i, p[i])
		// console.log('fcts', fcts)
		// console.log('vpfcts', vpfcts)
		// console.log('classes', classes)
		// console.log('classinstances', classinstances)
		// console.log('classmethods', classmethods)
		// console.log('============================================================================')
		// var i = program.search('scene = ')
		// console.log(program.slice(i))
		// console.log(program)
		return program
    } // end of compile function
    window.glowscript_compile = compile

})(); // This semicolon is not optional, for some reason associated with the minification of the library.
