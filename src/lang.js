// 中间码管理器
'use strict';
module.exports = (function () {
    var keywords = [];
    var delim = '\u001F'; // Unit Separator
    var rdelim = '\\u001F';
    var slice = [].slice;
    var map = {
        // 添加中间码类型
        add: function (type) {
            if (~keywords.indexOf(type)) {
                return this;
            }
            var stack = [];

            keywords.push(type);
            map[type] = {
                wrap: function (value) {
                    return this.ld + slice.call(arguments, 0).join(delim) + this.rd;
                }
            };

            // 定义map.ld
            Object.defineProperty(map[type], 'ld', {
                get: function () {
                    var depth = stack.length;

                    stack.push(depth);
                    return delim + type + depth + delim;
                }
            });

            // 定义map.rd
            Object.defineProperty(map[type], 'rd', {
                get: function () {
                    return delim + stack.pop() + type + delim;
                }
            });
        }
    };

    // 获取能识别中间码的正则
    Object.defineProperty(map, 'reg', {
        get: function () {
            return new RegExp(
                rdelim + '(' + keywords.join('|') + ')(\\d+?)' + rdelim + '([^' + rdelim + ']*?)(?:' + rdelim + '([^' + rdelim + ']+?))?' + rdelim + '\\2\\1' + rdelim,
                'g'
            );
        }
    });

    // 默认支持的中间码
    [
        'require', // 同步依赖文件。
        // 'jsRequire', // 同步 js 依赖
        'embed', // 内嵌其他文件
        // 'jsEmbed', // 内嵌 js 文件内容
        // 'async', // 异步依赖
        // 'jsAsync', // js 异步依赖
        'uri', // 替换成目标文件的 url
        // 'dep', // 简单的标记依赖
        // 'id', // 替换成目标文件的 id
        // 'hash', // 替换成目标文件的 md5 戳。
        // 'moduleId', // 替换成目标文件的 moduleId
        // 'xlang', // 用来内嵌其他语言
        // 'info' // 能用来包括其他中间码，包裹后可以起到其他中间码的作用，但是不会修改代码源码。
    ].forEach(map.add);

    return map;
})();
