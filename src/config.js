'use strict';

var gutil = require('gulp-util');
var CONFIG = {
    include: null,
    dest: 'dist',
    task: '',
    exts: {
        smtpl: {
            release: false
        }
    }
};

function merge(source, target) {
    if (source && target && typeof source === 'object' && typeof target === 'object') {
        for (var key in target) {
            if (target.hasOwnProperty(key)) {
                source[key] = merge(source[key], target[key]);
            }
        }
    } else {
        source = target;
    }
    return source;
}

function Config(config) {
    if (Config.instance instanceof Config) {
        return Config.instance;
    }
    this.config = merge(config, CONFIG);

    Config.instance = this;
}

Config.prototype = {
    set: function (key, value) {
        if (typeof value !== 'undefined') {

            key = String(key || '').trim();
            if (key) {
                var paths = key.split('.'),
                    last = paths.pop(),
                    data = this.config || {};

                paths.forEach(function (key) {
                    var type = typeof data[key];

                    if (type === 'object') {
                        data = data[key];
                    } else if (type === 'undefined') {
                        data = data[key] = {};
                    } else {

                        gutil.log('forbidden to set property[' + key + '] of [' + type + '] data');

                    }
                });
                data[last] = value;
            }
        }
    },
    get: function (keyPath) {
        var keys = keyPath.split('.'),
            key,
            config = this.config;

        for (var i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            if (i == len - 1) {
                return config[key];
            } else if (key in config) {
                config = config[key];
            } else {
                return;
            }
        }
    },
    merge: function (config) {
        this.config = merge(this.config, config);
    },
    load: function (path) {
        var config;

        if (path) {
            try {
                config = require(path);
                this.merge(config || {});
            } catch (e) {
                gutil.log('Loading or Parsing the configuration file "' + path + '" is incorrect: ' + e.message);
            }
        } else {
            gutil.log('missiong config file [sphinx-conf.js] or [sphinx-conf.json]');
        }
    }
};

module.exports = new Config({});
module.exports.Config = Config;
