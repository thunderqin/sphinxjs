var through = require('through2');
// 需要 copy 的属性
var keys = [
    'contents',
    'base',
    'path',
    'cwd'
];
// 属性前缀，避免重复
var prefix = 'copy_' + (Math.random() + '').replace(/\D/g, '') + '_';

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            keys.forEach(function (key) {
                var ckey = prefix + key;

                file[ckey] = file[key];
            });
            this.push(file);
            return cb();
        }
    });
};
module.exports.restore = function () {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            keys.forEach(function (key) {
                // copy key
                var ckey = prefix + key;

                if (file[ckey]) {
                    file[key] = file[ckey];
                    // clean
                    file[ckey] = null;
                    delete file[ckey];
                }
            });
            this.push(file);
            return cb();
        }
    });
};
