var NwBuilder = require('node-webkit-builder');
var gulp = require('gulp');
var gutil = require('gulp-util');
var exec = require('child_process').exec;
var fs = require('fs');
var glob = require("glob");
var rimraf = require('rimraf');
 
gulp.task('nw', function () {
    rimraf.sync('build');
 
    var nw = new NwBuilder({
        files: [ 'package.json', 'src/**'],
        platforms: ['osx', 'win', 'linux32', 'linux64'] // change this to 'win' for/on windows
    });
 
    // Log stuff you want
    nw.on('log', function (msg) {
        gutil.log('node-webkit-builder', msg);
    });
 
    // Build returns a promise, return it so the task isn't called in parallel
    return nw.build().catch(function (err) {
        gutil.log('node-webkit-builder', err);
    });
});


// run a command in a shell

gulp.task('package', ['nw'], function(cb) {
    var oldDir = process.cwd();
    var path = glob.sync("build/*")[0] + "/win";
    process.chdir(path);
    
    fs.writeFileSync('phantomjs.exe', fs.readFileSync('../../../phantomjs.exe'));
    var exeName = glob.sync('*.exe').filter(function(a) {return !/phantomjs/.test(a);})[0];
    var includes = glob.sync('*').filter(function(a) {
        return a.indexOf(exeName) === -1 && a.indexOf('app.evp') === -1 && a.indexOf('.') !== -1;
    }).join(' ');
    exec('enigmavirtualbox gen app.evp boxed.exe ' + exeName + ' ' + includes, function(err) {
        if (err) return cb(err); // return error
        exec('enigmavirtualbox cli app.evp', function(err) {
            //console.log(err);
            //if (err) return cb(err); // return error
            fs.writeFileSync('../../../boxed.exe', fs.readFileSync('boxed.exe'));
            process.chdir(oldDir);
            cb(); // finished task
        });
    });
});

gulp.task('dev', function(cb) {
    exec('nwbuild -r src/', cb);
})