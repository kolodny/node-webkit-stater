var gulp = require('gulp');
var gutil = require('gulp-util');
var http = require('http');
var fs = require('fs');
var path = require('path')
var exec = require('child_process').exec;
var glob = require("glob");
var rimraf = require('rimraf');
var NwBuilder = require('node-webkit-builder');
var detectCurrentPlatform = require('node-webkit-builder/lib/detectCurrentPlatform.js');

var fakeEnpoint, server;
 
gulp.task('build', function () {
    try {
        rimraf.sync('build');
    } catch(e) {}
    rimraf.sync('build');
 
    return createNwBuilder();
});

gulp.task('buildOffline', ['offline', 'build'], function() {
    if (server) { server.close(); }
});

gulp.task('test', function(cb) {
    return createNwBuilder(true);
});

gulp.task('offline', function() {
    server = http.createServer(function (request,response) {
        response.writeHead(200,{"Content-Type": "text/html"});
        response.end('href="v0.10.5/"');
    }).listen();
    fakeEnpoint = 'http://localhost:' + server.address().port;
    console.log(fakeEnpoint)
});


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
            exec('boxed');
            cb(); // finished task
        });
    });
});


function createNwBuilder(run) {
    var options = {
        files: 'src/**/*',
        platforms: ['osx', 'win', 'linux32', 'linux64'],
        version: 'latest',
        cacheDir: path.resolve(__dirname, 'cache'),
        buildDir: path.resolve(__dirname, 'build')
    };
    if (fakeEnpoint) {
        options.downloadUrl = fakeEnpoint;
    }
    if (run) {
        var currentPlatform = detectCurrentPlatform()
        options.platforms = [ currentPlatform ];
        options.currentPlatform = currentPlatform;
    }
    var nw = new NwBuilder(options);
    nw.on('log', function (msg) {
        gutil.log('node-webkit-builder', msg);
    });

    var np = (run ? nw.run() : nw.build());
    return np.catch(function (err) {
        throw new gutil.PluginError('node-webkit-builder', err);
    });
}
