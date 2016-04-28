'use strict';
var through = require('through2');
var alpaca = require('alpaca-sm');
var gutil = require('gulp-util');
var util = require('./util.js');
var pth = require('path');
var fs = require('fs');
var list = {};

function dealPath(path) {
    var extname = pth.extname(path),
        dirname,
        basename;

    if (extname !== '.css') {
        return path;
    } else {
        dirname = pth.dirname(path);
        basename = pth.basename(path, extname);

        for (var i = 0, list = ['.css', '.scss', '.sass'], len = list.length; i < len; i++) {
            path = dirname + '/' + basename + list[i];

            if (fs.existsSync(path)) {
                return path;
            }
        }

    }
}

function m2c(file, stream, config, cb) {
    var path, result;

    if (!file.isDirectory()) {
        path = dealPath(file.path);
        result = alpaca.processor({
            src: path,
            contentProcessor: function (aFile) {
                var pathKey;

                if (aFile.isLikeCss) {
                    pathKey = aFile.dirname + '/' + aFile.basename + '.css';
                } else {
                    pathKey = aFile.realpath;
                }

                if (pathKey in list) {
                    return list[pathKey].contents;
                }

            },
            isJudgeFileExist: 1,
            config: config || {
                fileBasedRoot: false,
                ns: 'sm'
            }
        });

        // file.contents = new Buffer(storage[pth.relative(file.cwd,path).replace(/[\/\\]/, '/').replace(/^\\/, '')].getContent());
        if (result) {
            file.contents = new Buffer(result.getContent());
        }
    }
    stream.push(file);
}

function processor(stream, config, cb) {

    try {
        for (var pth in list) {

            m2c(list[pth], stream, config, cb);
        }
    } catch (e) {
        cb(new gutil.PluginError('m2c', e.message));
        return;
    }
    list = {};

    return cb();
}

module.exports = function (config) {
    return through.obj(function (file, enc, cb) {
        var extname;

        if (file.isNull()) {
            this.push(file);
            return cb();
        }
        extname = util.extname(file.path);
        if (!util.isCss(extname) && !util.isJs(extname) && !util.isHtml(extname)) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            var cStream = file.contents, chunks = [],
                onreadable = function () {
                    var chunk;

                    while (null !== (chunk = cStream.read())) {
                        chunks.push(chunk);
                    }
                };

            cStream.on('readable', onreadable);
            cStream.once('end', function () {
                cStream.removeListener('readable', onreadable);
                file.contents = Buffer.concat(chunks);
                list[file.path] = file;
                cb();

            });
        }
        if (file.isBuffer()) {
            list[file.path] = file;
            cb();
        }

    }, function (cb) {

        return processor(this, config, cb);

    });
};

