'use strict';
function loadTaskPlugin(name) {
    if (name) {
        name = 'sphinx-task-' + name;
        try {
            return {
                Task: require(name)
            };
        } catch (e) {
            return {
                error: new Error('load task plugin [' + name + '] error : ' + e.message)
            };
        }
    } else {
        return {
            Task: require('./task')
        };
    }
};

module.exports = {
    loadTaskPlugin: loadTaskPlugin
};

