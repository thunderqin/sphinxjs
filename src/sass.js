'use strict';

var fs = require('fs');
var path = require('path');
var through = require('through2');
var execCss = require('./inline').execCss;
var lang = require('./lang');
var util = require('./util');

// 修复 @import 后文件相对路径无法定位资源的问题。
function fixSource(contents, dirname, cwd) {
    contents = execCss(contents);
    contents = contents.replace(lang.reg, function (all, type, depth, url, extra) {
        var info;

        info = util.uri(url, dirname, cwd);

        if (info.url && info.exists) {
            url = info.quote + info.url + info.query + info.quote;
        }

        return url;
    });

    return contents;
}

function resolve(filename, dir, cwd) {
    var files = [];
    var found;
    var basename = util.basename(filename);
    var dirname = util.dirname(filename);

    // 兼容各种不规范写法
    files.push(path.join(dirname, basename));
    files.push(path.join(dirname, '_' + basename));
    files.push(path.join(dirname, '_' + basename + '.scss'));
    files.push(path.join(dirname, '_' + basename + '.sass'));
    files.push(path.join(dirname, basename + '.scss'));
    files.push(path.join(dirname, basename + '.sass'));

    files.every(function (file) {
        var info;
        var contents;

        info = util.uri(file, dir, cwd);

        if (util.isFile(info.rest)) {

            contents = fs.readFileSync(info.rest);

            found = {
                path: info.rest,
                dirname: info.dirname,
                contents: contents.toString()
            };

            return false;
        }

        return true;
    });

    return found;
}

function find(filename, paths, cwd) {
    var found = null;

    paths.every(function (dir) {
        var file;

        if ((file = resolve(filename, dir, cwd))) {
            found = file;
            return false;
        }

        return true;
    });

    return found;
}
module.exports = {
    importer: function (root) {
        return function (url, prev, done) {
            var options = this.options;
            var includePaths = options.includePaths.split(':');
            var target;
            var cwd = root || process.cwd();
            var dir;

            // 有可能不传prev
            if (prev !== 'stdin') {
                // 获取文件夹路径
                dir = util.dirname(prev);
            } else {
                dir = includePaths.shift();
            }

            target = find(url, [dir], cwd);

            if (!target) {
                // error
                done();
                return;
            }

            target.contents = fixSource(target.contents, target.dirname, cwd);

            done({
                file: target.path,
                contents: target.contents
            });
        };
    },

    fixImport: function () {
        return through.obj(function (file, enc, cb) {
            var contents;
            var reg = /(?:(?:\/\/.*?\n)|(?:\/\*[\s\S]*?\*\/))|(?:@\b(charset|import)\s([\s\S]*?)(?:\n|$)(?!\s+[^{@]*\n))/ig;

            if (file.isNull()) {
                this.push(file);
                return cb();
            }

            if (file.isStream()) {
                this.push(file);
                return cb();
            }

            if (file.isBuffer()) {
                contents = file.contents.toString();

                contents = contents.replace(reg, function (all, value) {

                    if (value && !/;$/.test(value)) {
                        all += ';';
                    }

                    return all;
                });

                file.contents = new Buffer(contents);
                this.push(file);
                return cb();
            }
        });
    }
};
