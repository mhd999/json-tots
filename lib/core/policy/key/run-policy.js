'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable camelcase */
var jp = require('jsonpath');

var runPolicy = function runPolicy(keyPolicy, template, document) {
    var upwards = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 2;
    return function (_ref) {
        var path = _ref.path,
            tag = _ref.tag,
            source = _ref.source,
            templatePath = _ref.templatePath,
            tagPath = _ref.tagPath;

        var parentNodePath = jp.paths(template, path).pop();

        var _parentNodePath$slice = parentNodePath.slice(-upwards),
            _parentNodePath$slice2 = (0, _slicedToArray3.default)(_parentNodePath$slice, 2),
            parent = _parentNodePath$slice2[0],
            child = _parentNodePath$slice2[1];

        var newPath = keyPolicy(parent, child, tagPath, document);
        // transplant under new path
        templatePath = jp.stringify(parentNodePath.slice(0, -upwards).concat([newPath]));
        jp.value(template, templatePath, jp.value(template, path));
        // unset original path
        jp.value(template, path, undefined);
        return { template: template, templatePath: templatePath };
    };
};

module.exports = {
    runPolicy: runPolicy
};