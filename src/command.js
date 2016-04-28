'use strict';
var yargs = require('yargs'),
    chalk = require('chalk'),
    argvOptions, commander;

argvOptions = {
    M: {
        alias: 'm2c',
        demand: false,
        type: 'boolean',
        describe: chalk.gray('opening modular')
    },
    d: {
        alias: 'dest',
        demand: false,
        type: 'string',
        'default': 'dist',
        describe: chalk.gray('release output destination')
    },
    o: {
        alias: 'optimize',
        demand: false,
        type: 'boolean',
        describe: chalk.gray('with optimizing')
    },
    t: {
        alias: 'task',
        demand: false,
        type: 'string',
        describe: chalk.gray('mount plugin task')
    },
    sphinxconf: {
        type: 'string',
        describe: chalk.gray('Manually set path of sphinxconf')
    }
};
commander = {
    release: {
        command: 'release',
        describe: chalk.gray('build and deploy your project'),
        builder: function () {
            return yargs
                .options(argvOptions)
                .usage(chalk.bold('\nUsage:') + ' $0 release [options]')
                .help('h')
                .alias('h', 'help')
                .describe('help', chalk.gray('show help information'));
        },
        handler: function (argv) {
        }
    },
    server: {
        command: 'server',
        describe: chalk.gray('launch web server'),
        builder: function () {
            return yargs
                .options(argvOptions)
                .usage(chalk.bold('\nUsage:') + ' $0 server [options]')
                .help('h')
                .alias('h', 'help')
                .describe('help', chalk.gray('show help information'));
        },
        handler: function (argv) {
        }
    }
};
module.exports = commander;
