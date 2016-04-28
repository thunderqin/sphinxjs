var through = require('through2');
var gutil = require('gulp-util');

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        gutil.log('cwd:' + file.cwd);
        gutil.log('path:' + file.path);
        gutil.log('base:' + file.base);
        gutil.log('cwd:' + file.cwd);
        gutil.log('stat:' + file.stat);
        this.push(file);
        return cb();
    });
};
