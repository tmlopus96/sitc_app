module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json');
    bower_concat:{
        all: {
                dest: "src/js/vendor/bower.js",
                destCss: “src/css/vendor/bower.css”
        }
    },
    
  });

};
