function reportScriptError(program, err, versionStringAdded) { // This machinery only gives trace information on Chrome
    // The trace information provided by browsers other than Chrome does not include the line number
    // of the user's program, only the line numbers of the GlowScript libraries. For that reason
    // none of the following cross browser stack trace reporters are useful for GlowScript:
    // Single-page multibrowser stack trace: https://gist.github.com/samshull/1088402
    // stacktrase.js https://github.com/stacktracejs/stacktrace.js    https://www.stacktracejs.com/#!/docs/stacktrace-js
    // tracekit.js; https://github.com/csnover/TraceKit
    var feedback = err.toString()+'\n'
    var compile_error = (feedback.slice(0,7) === 'Error: ')
    var prog = program.split('\n')
    //for(var i=0; i<prog.length; i++) console.log(i, prog[i])
    var unpack = /[ ]*at[ ]([^ ]*)[^>]*>:(\d*):(\d*)/
    var traceback = []
    if (err.cursor) {
        //console.log('err.cursor',err.cursor)
        // This is a syntax error from narcissus; extract the source
        var c = err.cursor
        while (c > 0 && err.source[c - 1] != '\n') c--;
        traceback.push(err.source.substr(c).split("\n")[0])
        //traceback.push(new Array((err.cursor - c) + 1).join(" ") + "^") // not working properly
    } else {
        // This is a runtime exception; extract the call stack if possible
        // Strange behavior: sometimes err.stack is an array of end-of-line-terminated strings,
        // and at other times it is one long string; in the latter case we have to create rawStack
        // as an array of strings. Also, sometimes must access err.stack and sometimes must access
        // err.__proto__.stack; Chrome seems to flip between these two schemes.
        var usestack = false
        try {
            var a = err.stack
            usestack = true
        } catch (ignore) {
        }
        try {
            var rawStack
            if (usestack) {
                rawStack = err.stack
                if (typeof err.stack == 'string') rawStack = rawStack.split('\n')
            } else {
                var rawStack = err.__proto__.stack
                if (typeof rawStack == 'string') rawStack = rawStack.split('\n')
                else rawStack = rawStack.toString()
            }

            // TODO: Selection and highlighting in the dialog
            var first = true
            var i, m, caller, jsline, jschar
            for (i=1; i<rawStack.length; i++) {
                m = rawStack[i].match(unpack)
                if (m === null) continue
                caller = m[1]
                jsline = m[2]
                jschar = m[3]
                if (caller.slice(0,3) == 'RS_') continue
                if (caller == 'compileAndRun') break
                if (caller == 'main') break

                var line = prog[jsline-1]
                if (window.__GSlang == 'javascript') { // Currently unable to embed line numbers in JavaScript programs
                    traceback.push(line)
                    traceback.push("")
                    break
                }
                var L = undefined
                var end = undefined
                for (var c=jschar; c>=0; c--) {  // look for preceding "linenumber";
                    if (line[c] == ';') {
                        if (c > 0 && line[c-1] == '"') {
                            var end = c-1 // rightmost digit in "23";
                            c--
                        }
                    } else if (line[c] == '"' && end !== undefined) {
                        L = line.slice(c+1,end)
                        break
                    } else if (c === 0) {
                        jsline--
                        line = prog[jsline-1]
                        c = line.length
                    }
                }
                if (L === undefined) continue
                var N = Number(L)
                var line_no = N;
                var line_index = N - 1;
                if (isNaN(N)) break // Sometimes necessary.....
                if (versionStringAdded) {
                    line_no--;
                }
                else if (!/^GlowScript/.test(window.__original.text[0])) {
                  line_index--;
                }
                if (first) traceback.push('At or near line '+line_no+': '+window.__original.text[line_index])
                else traceback.push('Called from line '+line_no+': '+window.__original.text[line_index])
                first = false
                traceback.push("")
                if (caller == '__$main') break
            }
        } catch (ignore) {
        }
    } 

    var out = ''
    for (var i= 0; i<traceback.length; i++) out += traceback[i] + '\n'
    return out;

} // end of reportScriptError
