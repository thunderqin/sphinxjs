'use strict';
var yargs = require('yargs');
var chalk = require('chalk');
var command = require('./command.js');

module.exports = yargs
    .options({
        v: {
            alias: 'version',
            demand: false,
            describe: chalk.gray('output the version number')
        }
    })
    .usage(chalk.bold('\nUsage:') + ' $0 ' + chalk.blue('<command>'))
    .command(command.release)
    .command(command.server)
    .help('h')
    .alias('h', 'help')
    .describe('help', chalk.gray('show help infomation'))
    .example('$0 release -M', 'Open the module to publish your project')
    .locale('en')
    .argv;
