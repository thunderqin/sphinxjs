'use strict';
var util = require('../../src/util.js');
var expect = require('chai').expect;
var path = require('path');
var dataPath = path.resolve(__dirname, '../data');

describe('sphinx util.js', function () {
    describe('isFile()', function () {
        it('判定给定的path，是否是一个存在的文件', function (done) {
            var pth = dataPath + '/util.data.js';

            expect(util.isFile(pth)).to.be.ok;
            expect(util.isFile(dataPath)).to.be.not.ok;
            done();
        });
    });

    describe('isDir()', function () {
        it('判定给定的path，是否是一个存在的目录', function (done) {
            var pth = dataPath + '/util.data.js';

            expect(util.isDir(dataPath)).to.be.ok;
            expect(util.isDir(pth)).to.be.not.ok;
            done();
        });
    });
    describe('isText()', function () {
        it('判定给定的path，是否是一个文本', function (done) {

            expect(util.isText('.js')).to.be.ok;
            expect(util.isText('.png')).to.be.not.ok;
            done();
        });
    });
    describe('extname()', function () {
        it('获取扩展名', function (done) {

            expect(util.extname('test.js')).to.be.equal('.js');
            expect(util.isText('test.png')).to.be.not.equal('.js');
            done();
        });
    });
});
