// todo 是否抛出插件级错误
// todo 是否统一抛出错误，不中断编译流程。
// todo 结合邮件提醒功能
'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var util = require('./util');
var lang = require('./lang');
var _map = {};
var _cache = [];

function clean() {
    _map = {};
    _cache.length = 0;
}

function getFile(path) {
    var index = _map[path];

    return _cache[index];
}

function embed(obj, stream, cb) {
    var file, contents, dirname, cwd;

    if (obj.piped) {
        return;
    }

    file = obj.file;

    // 非图片
    if (util.isImage(util.extname(file.path))) {
        obj.piped = true;
        stream.push(file);
        return;
    }

    contents = file.contents.toString();
    dirname = util.dirname(file.path);
    cwd = file.cwd;

    contents = contents.replace(lang.reg, function (all, type, depth, url, extra) {
        var info, f, ret, message;

        try {
            switch (type) {
                case 'embed':
                    info = util.uri(url, dirname, cwd);
                    f = getFile(info.rest);

                    if (f) {
                        if (!f.piped) {
                            embed(f, stream, cb);
                        }

                        ret = f.file.contents;
                        if (!util.isText(info.extname)) {
                            // 非文本文件 buffer
                            ret = info.quote + util.base64(ret, info.extname) + info.quote;
                        } else {
                            // 文本文件必须 toString()
                            ret = ret.toString();
                        }
                    } else {
                        ret = url;
                        message = 'unable to embed file [' + info.rest + '] in [' + file.path + ']';
                    }
                    break;
                case 'uri':
                    info = util.uri(url, dirname, cwd);

                    if (info.url && info.exists) {
                        f = getFile(info.rest);
                        if (f) {
                            if (!f.piped) {
                                embed(f, stream, cb);
                            }

                            ret = info.quote + info.url + info.quote;
                        } else {
                            message = 'unable to locate file [' + info.rest + '] in [' + file.path + ']';
                            ret = url;
                        }
                    } else {
                        ret = url;
                    }

                    break;
                case 'require':
                    info = util.uri(url, dirname, cwd);

                    if (info.id && info.exists) {
                        f = getFile(info.rest);
                        if (f) {
                            if (!f.piped) {
                                embed(f, stream, cb);
                            }

                            ret = info.quote + info.id + info.quote;
                        } else {
                            message = 'unable to locate file [' + info.rest + '] in [' + file.path + ']';
                            ret = url;
                        }
                    } else {
                        ret = url;
                    }

                    break;
            }

            if (message) {
                // error
                cb(new gutil.PluginError('embed', message));
            }
        } catch (e) {
            message = e.message;
            // error
            cb(new gutil.PluginError('embed', message));
        }

        return ret;
    });

    file.contents = new Buffer(contents);
    obj.piped = true;
    stream.push(file);
}

function process(stream, cb) {
    _cache.forEach(function (item) {
        embed(item, stream, cb);
    });

    clean();
    return cb();
}

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
            _cache.push({
                file: file,
                piped: false
            });
            _map[file.path] = _cache.length - 1;
            cb();
        }
    }, function (cb) {
        return process(this, cb);
    });
};
