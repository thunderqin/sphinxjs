'use strict';
var through = require('through2');
var ext = require('./ext');
var util = require('./util');
var lang = require('./lang');

function isInline(url) {
    return /[?&]__inline(?:[=&'"]|$)/.test(url);
}

function execJs(contents) {
    var reg = /(?:\/\/[^\r\n\f]+|\/\*[\s\S]*?(?:\*\/|$))|\b(__inline|__uri|require)\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])+"|'(?:[^\\'\n\r\f]|\\[\s\S])+')\s*\)/g;

    contents = contents.replace(reg, function (m, type, url) {

        if (!url) {
            return m;
        }

        switch (type) {
            case '__inline':
                m = lang.embed.wrap(url);
                break;
            case '__uri':
                m = lang.uri.wrap(url);
                break;
            case 'require':
                m = 'require(' + lang.require.wrap(url) + ')';
                break;
        }

        return m;
    });

    return contents;
}

function execCss(contents) {
    // 解决注释 /* */ 也会内嵌问题 (?:\/\*[\s\S]*?(?:\*\/|$))
    var reg = /(?:\/\*[\s\S]*?(?:\*\/|$))|url\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])+"|'(?:[^\\'\n\r\f]|\\[\s\S])+'|[^}\s]+)\s*\)(\s*;?)/g;

    return contents.replace(reg, function (m, url, last) {

        if (!url) {
            return m;
        }

        if (isInline(url)) {
            m = 'url(' + lang.embed.wrap(url) + ')' + last;
        } else {
            m = 'url(' + lang.uri.wrap(url) + ')' + last;
        }

        return m;
    });
}

function execHtml(contents) {
    // (?:<!--[\s\S]*?-->) 过滤掉注释
    var reg = /(?:<!--[\s\S]*?-->)|(<script(?:(?=\s)[\s\S]*?>|>))([\s\S]*?)(?=<\/script\s*>)|(<style(?:(?=\s)[\s\S]*?>|>))([\s\S]*?)(?=<\/style\s*>)|<(img|link)\s+[\s\S]*?(?:>)/ig;

    contents = contents.replace(reg, function (m, $1, $2, $3, $4, $5) {

        if ($1) {
            var embed;

            $1 = $1.replace(/(\ssrc\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function (m, prefix, url) {

                if (isInline(url)) {
                    embed = lang.embed.wrap(url);
                    return '';
                } else {
                    return prefix + lang.uri.wrap(url);
                }
            });

            if (embed) {
                m = $1 + embed;
            } else if (!/\s+type\s*=/i.test($1) || /\s+type\s*=\s*(['"]?)text\/javascript\1/i.test($1)) {
                m = $1 + execJs($2);
            // html 处理比较蛋疼 是否删除
            } else {
                m = $1 + execHtml($2);
            }
        // style
        } else if ($3) {
            m = $3 + execCss($4);
        } else if ($5) {
            var tag = $5.toLowerCase();

            if (tag === 'link') {
                var inline = '', rel, isCssLink, isImportLink;

                rel = m.match(/\srel\s*=\s*('[^']+'|"[^"]+"|[^\s\/>]+)/i);

                if (rel && rel[1]) {
                    rel = rel[1].replace(/^['"]|['"]$/g, '').toLowerCase();
                    isCssLink = rel === 'stylesheet';
                    isImportLink = rel === 'import';
                }

                m = m.replace(/(\shref\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function (_, prefix, url) {
                    if ((isCssLink || isImportLink) && isInline(url)) {
                        if (isCssLink) {
                            inline += '<style' + m.substring(5).replace(/\/(?=>$)/, '').replace(/\s+(?:charset|href|data-href|hreflang|rel|rev|sizes|target)\s*=\s*(?:'[^']+'|"[^"]+"|[^\s\/>]+)/ig, '');
                        }
                        inline += lang.embed.wrap(url);
                        if (isCssLink) {
                            inline += '</style>';
                        }

                        return '';
                    } else {
                        return prefix + lang.uri.wrap(url);
                    }
                });

                m = inline || m;

            } else {
                m = m.replace(/(\ssrc\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function (_, prefix, url) {
                    if (isInline(url)) {
                        return prefix + lang.embed.wrap(url);
                    } else {
                        return prefix + lang.uri.wrap(url);
                    }
                });
            }
        }

        return m;
    });

    return contents;
}

function process(file) {
    var contents = file.contents.toString();
    var extname = util.extname(file.path);

    // not image
    if (util.isImage(extname)) {
        return;
    }

    switch (util.extname(file.path)) {
        case ext.js:
            contents = execJs(contents);
            break;
        case ext.css:
            contents = execCss(contents);
            break;
        case ext.html:
            contents = execHtml(contents);
            break;
    }

    file.contents = new Buffer(contents);
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
            process(file);
            this.push(file);
            return cb();
        }
    });
};
module.exports.execCss = execCss;
module.exports.execJs = execJs;
module.exports.execHtml = execHtml;
