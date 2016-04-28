'use strict';
var mergeStream = require('merge-stream');
var gulp = require('gulp');
// 错误处理
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var filter = require('gulp-filter');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var inline = require('../inline');
var embed = require('../embed');
var copy = require('../copy');
var _ = require('../util');
var importer = require('../sass').importer;
var fixImport = require('../sass').fixImport;
var ext = require('../ext');

var util = require('util');
var Event = require('events').EventEmitter;

var config = require('../config.js');

var objectAssign = require('object-assign');

function Base(path, conf) {
    this._path = path;
    this._optimize = conf.argv.o;
    this._cwd = conf.cwd;
    this._dest = conf.dest;
    Event.call(this);
}

util.inherits(Base, Event);

var prototype = {
    /*
     * 返回 stream
     */
    get stream() {
        var stream = mergeStream();

        // 读取文件
        stream = this.src(stream);
        // 错误处理
        stream = stream
            .pipe(plumber({
                errorHandler: notify.onError('Error: <%= error.message %>')
            }));

        this.emit('beforeCompile', stream, function (stm) {
            stream = stm;
        });
        // 编译
        stream = this.compile(stream);

        // 拷贝副本
        if (this._optimize) {
            stream = stream
                .pipe(copy());
        }

        stream = this.dest(stream);

        // 优化压缩
        if (this._optimize) {
            // 恢复文件，并释放内存
            stream = stream.pipe(copy.restore());

            stream = this.optimize(stream);

            stream = this.dest(stream, true);
        }

        return stream;
    },

    // 获取文件类型列表
    get exts() {
        if (!this._exts) {
            this._exts = [];
            if (Base.handler) {
                Array.prototype.concat(
                    Object.keys(Base.handler),
                    Object.keys(this.handler),
                    Object.keys(config.get('exts') || {})
                )
                .forEach(function (ext) {
                    if (this._exts.indexOf(ext) === -1) {
                        this._exts.push(ext);
                    }
                }.bind(this));
            }
        }

        return this._exts;
    },

    src: function (stream) {

        if (this._path.length > 0) {
            this._path.forEach(function (path) {
                var opts = {};

                if (path.base) {
                    opts['base'] = path.base;
                }
                stream.add(
                    gulp.src(path.glob, opts)
                );
            });
        }
        return stream;
    },
    _isRelease: function (extname) {
        var handler, exts;

        if (this.exts.indexOf(extname) >= 0) {
            exts = config.get('exts');
            if (exts) {
                exts = exts[extname];
            }

            handler = objectAssign(Base.handler[extname] || {}, this.handler[extname] || {}, exts || {});
            if (!('release' in handler)) {
                return true;
            } else {
                return handler.release;
            }
        } else {
            return true;
        }
    },

    /* flag 是否更改文件名生成 .min 文件 */
    dest: function (stream, flag) {
        var filterStream;

        stream = stream
                .pipe(inline())
                .pipe(embed());

        this.emit('compiled', stream, function (stm) {
            stream = stm;
        }, flag);

        stream = stream.pipe(filter((function (file) {
            var extname = _.extname(file.path).replace('.', '');

            return this._isRelease(extname);

        }).bind(this)));
        if (flag) {
            filterStream = filter(function (file) {
                var path = file.path,
                    extname = _.extname(path);

                return _.isJs(extname) || _.isCss(extname);
            }, {restore: true});

            stream = stream.pipe(filterStream);

            stream = stream.pipe(rename(function (path) {
                path.extname = '.min' + path.extname;
                return path;
            }));
            stream = stream.pipe(filterStream.restore);
        }
        return stream
            .pipe(gulp.dest(this._dest));
    },

    // 对 compile 和 optimize 的封装
    job: function (stream, type) {
        if (!type) {
            return stream;
        }

        this.exts.forEach(function (extname) {
            var fileFilter = filter(function (file) {
                var f = ((this.handler[extname] && this.handler[extname].filter) ||
                    (Base.handler[extname] && Base.handler[extname].filter));

                return f && f(file.path);
            }.bind(this), {restore: true});

            stream = stream.pipe(fileFilter);
            if (Base.handler[extname] && Base.handler[extname][type]) {
                stream = Base.handler[extname][type](stream);
            }
            if (this.handler[extname] && this.handler[extname][type]) {
                stream = this.handler[extname][type](stream);
            }
            stream = stream.pipe(fileFilter.restore);
        }.bind(this));

        return stream;
    },

    compile: function (stream) {
        return this.job(stream, 'compile');
    },

    optimize: function (stream) {
        return this.job(stream, 'optimize');
    },

    destory: function () {

    }
};

Base.constructor = Base;

// 默认处理器
Base.handler = {
    js: {
        filter: function (path) {
            var extname = _.extname(path);

            return _.isJs(extname);
        },

        compile: function (stream) {
            return stream;
        },

        optimize: function (stream) {
            // js 文件压缩
            // todo 设置参数
            return stream
                .pipe(uglify());
        }
    },
    css: {

        filter: function (path) {
            var extname = _.extname(path);

            return _.isCss(extname);
        },

        compile: function (stream) {
            var scssFilter;

            scssFilter = filter(function (file) {
                var extname = _.extname(file.path);

                return extname === ext.scss || extname === ext.sass;
            }, {restore: true});

            return stream
                .pipe(scssFilter)
                .pipe(fixImport())
                .pipe(sass({
                    importer: importer(this._cwd),
                    includePaths: [this._cwd]
                }))
                .pipe(scssFilter.restore);
        },

        optimize: function (stream) {
            // css 文件压缩 todo 设置参数
            return stream
                .pipe(minifyCss());
        }
    },

    html: {

        filter: function (path) {
            var extname = _.extname(path);

            return _.isHtml(extname);
        },

        compile: function (stream) {
            return stream;
        },

        optimize: function (stream) {
            return stream;
        }
    },

    image: {

        filter: function (path) {
            var extname = _.extname(path);

            return _.isImage(extname);
        },

        compile: function (stream) {
            return stream;
        },

        optimize: function (stream) {
            return stream;
        }
    },

    tpl: {

        filter: function (path) {
            var extname = _.extname(path);

            return _.isTpl(extname);
        },

        compile: function (stream) {
            return stream;
        },

        optimize: function (stream) {
            return stream;
        }
    }
};

Base.type = Object.keys(Base.handler);

// 此处有坑，不能使用Base.prototype[key] = prototype[key]
for (var key in prototype) {
    Object.defineProperty(Base.prototype, key, Object.getOwnPropertyDescriptor(prototype, key));
}

module.exports = Base;
