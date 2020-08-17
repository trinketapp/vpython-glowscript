var gulp   = require('gulp')
  , uglify = require('gulp-uglify-es').default
  , concat = require('gulp-concat-util')
  , wrap   = require('gulp-wrap')
  , tap    = require('gulp-tap')
  , header = require('gulp-header')
  , util   = require('gulp-util')
  , path   = require('path')
  , version
  , glowscript_libraries;

version = '3.0.0';

glowscript_libraries = {
  "glow": [
    "lib/jquery/2.1/jquery.mousewheel.js",
    "lib/flot/jquery.flot.js",
    "lib/flot/jquery.flot.crosshair_GS.js",
    "lib/plotly.js",
    "lib/opentype/poly2tri.js",
    "lib/opentype/opentype.js",
    "lib/glMatrix.js",
    "lib/webgl-utils.js",
    "lib/glow/property.js",
    "lib/glow/vectors.js",
    "lib/glow/mesh.js",
    "lib/glow/canvas.js",
    "lib/glow/orbital_camera.js",
    "lib/glow/autoscale.js",
    "lib/glow/WebGLRenderer.js",
    "lib/glow/graph.js",
    "lib/glow/color.js",
    "lib/glow/shapespaths.js",
    "lib/glow/primitives.js",
    "lib/glow/api_misc.js",
    "lib/glow/extrude.js",
    "lib/glow/shaders.gen.js"
  ],
  "compiler": [
    "lib/compiling/GScompiler.js",
    "lib/compiling/acorn.js",
    "lib/compiling/papercomp.js"
  ],
  RSrun: [
    "lib/rapydscript/runtime.js"
  ],
  RScompiler: [
    "lib/rapydscript/compiler.js",
    "lib/compiling/GScompiler.js",
    "lib/compiling/acorn.js",
    "lib/compiling/papercomp.js"
  ],
};

gulp.task('default', function() {
  var shaders = []
    , shader_key;

  gulp.src('./shaders/*.shader')
    .pipe(tap(function(file) {
      shader_key = path.basename(file.path, '.shader');
      file.contents = Buffer.from('"' + shader_key + '":' + JSON.stringify(file.contents.toString()));
      return file;
    }))
    .pipe(concat('shaders.gen.js', { sep : ',\n' }))
    .pipe(wrap('Export({ shaders: {\n<%= contents %>\n}});'))
    .pipe(gulp.dest('./lib/glow/'));

  Object.keys(glowscript_libraries).forEach(function(lib) {
    return gulp.src(glowscript_libraries[lib])
      .pipe(uglify().on('error', util.log)) // notice the error event here
      .pipe(concat(lib + '.' + version + '.min.js'))
      .pipe(header("/*This is     a combined, compressed file.  Look at https://github.com/BruceSherwood/glowscript for source code and copyright information.*/"))
      .pipe(gulp.dest('./package/'));
  });
});
