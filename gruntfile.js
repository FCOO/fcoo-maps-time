/***********************************************
gruntfile.js for fcoo-maps-time

https://github.com/FCOO/fcoo-maps-time

***********************************************/

module.exports = function(grunt) {

    "use strict";

    //***********************************************
    grunt.initConfig({
        "fcoo_grunt_plugin":{
            default: {
                "haveJavaScript": true,  //true if the packages have js-files
                "haveStyleSheet": true,  //true if the packages have css and/or scss-files
                "haveGhPages"   : true,  //true if there is a branch "gh-pages" used for demos

                "beforeProdCmd": "",     //Cmd to be run at the start of prod-task. Multi cmd can be seperated by "&"
                "beforeDevCmd" : "",     //Cmd to be run at the start of dev-task
                "afterProdCmd" : "",     //Cmd to be run at the end of prod-task
                "afterDevCmd"  : "",     //Cmd to be run at the end of dev-task

                "build_noCheck"        : true,   //If true no syntax check when building package
                "build_bowerFullUpdate": true,   //If true full bower update when building package

                "DEBUG"        : false   //if true different debugging is on and the tempoary files are not deleted
            }
        }
    });


    //****************************************************************
    //Load grunt-packages
    grunt.loadNpmTasks('grunt-fcoo-grunt-plugin');
};