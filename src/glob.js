'use strict';

var fs = require('fs');
var config = require('./config.js');
var pth = require('path');

function formatPath(path) {
    var rPath = path.replace(/[\\\/]/g, '/');

    return rPath;
}

function buildGlob(root, dest, deep) {
    var globs = [],
        files;

    dest = formatPath(pth.relative(root, dest || config.get('dest'))).split('/')[0];
    deep = deep || 2;
    (function getBolbs(dir, curDeep) {
        files = fs.readdirSync(dir);

        files.forEach(function (name) {
            var path,
                stat,
                rPath,
                glob;

            if (name.indexOf('.') == 0 || (curDeep == 1 && dest == name)) {
                return;
            }

            path = dir + '/' + name;
            stat = fs.statSync(path);
            rPath = formatPath(pth.relative(root, path));
            if (rPath.indexOf('/') > 0) {
                rPath = '+(' + rPath.replace(/\//, ')/');
            } else {
                rPath = '+(' + rPath + ')';
            }
            if (stat.isDirectory()) {
                if (curDeep < deep) {
                    getBolbs(path, curDeep + 1);
                } else {

                    glob = rPath + '/**';
                }

            } else {
                glob = rPath;
            }
            glob && globs.push(glob);

        });
    }(root, 1));
    return globs;
}
module.exports = buildGlob;

