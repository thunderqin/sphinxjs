'use strict';
var argv = require('./src/cli.js');
var pkg = require('./package.json');
var Liftoff = require('liftoff');
var gutil = require('gulp-util');
var gulp = require('gulp');
var chalk = gutil.colors;
var prettyTime = require('pretty-hrtime');
var tasks = argv._;

var cli = new Liftoff({
    name: 'sphinx',
    configName: 'sphinx-conf',
    extensions: {
        '.js': null,
        '.json': null
    }
});

cli.launch({
    cwd: argv.cwd || process.cwd(),
    configPath: argv.sphinxconf
}, invoke);

function invoke(env) {
    var version = [];

    if (argv.version && tasks.length === 0) {
        console.log('\n\r  v' + pkg.version + '\n');
        version.push('\t┏┛ ┻━━━━━┛ ┻┓');
        version.push('\t┃           ┃');
        version.push('\t┃　 　━     ┃');
        version.push('\t┃  ┳┛   ┗┳　┃');
        version.push('\t┃　 　　　  ┃');
        version.push('\t┃     ┻　　 ┃');
        version.push('\t┗━┓　　┏━━━━┛');
        version.push('\t  ┃　　┃');
        version.push('\t  ┃　　┗━━━━━━━━┓');
        version.push('\t  ┃　　　　　　 ┣┓');
        version.push('\t  ┃　　　　     ┏┛');
        version.push('\t  ┗━┓ ┓ ┏━┳ ┓ ┏━┛');
        version.push('\t    ┃ ┫ ┫ ┃ ┫ ┫');
        version.push('\t    ┗━┻━┛ ┗━┻━┛\n\r');
        console.log(chalk.yellow(version.join('\n')));
        process.exit(0);
    }

    if (tasks.length === 0) {
        tasks = ['release'];
    }
    // 加载配置文件
    require('./index')(argv, env);

    gulp.on('start', function (e) {
        gutil.log('Starting', '\'' + chalk.cyan(e.name) + '\'...');
    });
    gulp.on('stop', function (e) {
        var time = prettyTime(e.duration);

        gutil.log(
            'Finished', '\'' + chalk.cyan(e.name) + '\'',
            'after', chalk.magenta(time)
        );
    });
    gulp.on('error', function (e) {
        var msg = formatError(e);
        var time = prettyTime(e.duration);

        gutil.log(
            '\'' + chalk.cyan(e.name) + '\'',
            chalk.red('errored after'),
            chalk.magenta(time)
        );
        gutil.log(msg || e.error.stack);
    });
    process.nextTick(function () {
        try {
            gulp.parallel(tasks)(function (err) {
                if (err) {
                    process.exit(1);
                }
            });
        } catch (e) {
        };
    });

}

function formatError(e) {
    if (!e.error) {
        return e.message;
    }

    // PluginError
    if (typeof e.error.showStack === 'boolean') {
        return e.error.toString();
    }

    // Normal error
    if (e.error.stack) {
        return e.error.stack;
    }

    // Unknown (string, number, etc.)
    return new Error(String(e.error)).stack;
}
