'use strict';

/* eslint-disable camelcase */
var jp = require('jsonpath');
var _ = require('lodash');

var _require = require('../../core/operators'),
    jpify = _require.jpify;

module.exports = function (parent, child, tagPath, document) {
    var tagPathLeaf = jp.paths(document, jpify(tagPath)).pop().pop();
    return _.snakeCase([parent, child, tagPathLeaf]);
};