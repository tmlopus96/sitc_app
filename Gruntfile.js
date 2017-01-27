module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    bower_concat:{
        all: {
          dest: {
                'js': 'app/vendor/bower.js',
                'css': 'app/vendor/bower.css'
          }
        }
    },
    uglify: {
      my_target: {
        files: {
          'dist/bower.min.js': ['app/vendor/bower.js']
        }
      }
    },
    cssmin: {
      target: {
        files: [{
          'dist/styles_fonts.min.css': ['app/vendor/bower.css', 'app/vendor/roboto.css']
        }]
      }
    },
    "goog-webfont-dl": {
      roboto: {
        options: {
          ttf: true,
          fontname: 'Roboto',
          fontstyles: '300,400,500,700,400italic',
          fontdest: '',
          cssdest: 'app/vendor/roboto.css',
          cssprefix: '',
          subset: ''
        }
      },
    }
  });

grunt.loadNpmTasks('grunt-bower-concat');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-goog-webfont-dl');

grunt.registerTask('default', ['bower_concat', 'uglify', 'cssmin', 'goog-webfont-dl']);

};
