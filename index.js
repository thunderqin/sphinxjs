'use strict';
var gulp = require('gulp');
var filter = require('gulp-filter');
var chokidar = require('chokidar');
var browserSync = require('browser-sync').create();
var cwd = process.cwd();
var plugin = require('./src/plugin.js');
var buildGlob = require('./src/glob.js');
var config = require('./src/config.js');
var Base = require('./src/task/base.js');
var util = require('./src/util.js');
var sphinx = {
    config: config,
    Base: Base,
    util: util
};

if (!global.sphinx) {
    Object.defineProperty(global, 'sphinx', {
        enumerable: true,
        writable: false,
        value: sphinx
    });
}

function execute(argv, env) {
    var taskPlugin;

    config.load(env.configPath);
    taskPlugin = plugin.loadTaskPlugin(argv.task || config.get('task'));
    gulp.task('config', function (cb) {
        var include;

        include = config.get('include');
        if (!include || !Array.isArray(include) || !include.length || !('glob' in include[0])) {
            config.set('include', [{
                glob: buildGlob(cwd, argv.d)
            }]);
        }
        cb();
    });

    function watch(root) {
        var ignored = require('path').join(root, (argv.d || config.get('dest'))),
            timer;

        function listener(type) {
            return function (path) {

                clearTimeout(timer);
                timer = setTimeout(function () {
                    var extname = util.extname(path);

                    if (!util.isCss(extname)) {
                        gulp.series('release', browserSync.reload)();
                    } else {
                        gulp.series('release')();
                    }
                }, 500);
            };
        }

        chokidar.watch(root, {
            ignored: ignored,
            ignoreInitial: true
        })
        .on('change', listener('change'))
        .on('unlink', listener('unlink'))
        .on('add', listener('add'));
    }

    gulp.task('build', function (cb) {
        var root = cwd,
            include = config.get('include'),
            dest;

        if (taskPlugin.error) {
            cb(taskPlugin.error);
        }

        if (argv.d && typeof argv.d == 'string') {
            dest = argv.d;
        } else {
            dest = config.get('dest') || 'dist';
        }
        return new taskPlugin.Task(include, {
            argv: argv,
            cwd: root,
            dest: dest
        })
        .stream
        .pipe(filter('**/*.css'))
        .pipe(browserSync.reload({stream: true}));
    });

    gulp.task('browserSync', function (cb) {
        browserSync.init({
            server: argv.d || config.get('dest')
        }, function () {
            watch(cwd);
            cb();
        });
    });
    gulp.task('release', gulp.series('config', 'build'));
    gulp.task('server', gulp.series('release', 'browserSync'));
}
module.exports = execute;
