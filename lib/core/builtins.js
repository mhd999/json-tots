'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-magic-numbers */
var jp = require('jsonpath');
var F = require('functional-pipelines');
var _uuid = require('uuid');
var md5 = require('md5');

var sx = require('./strings');

// eslint-disable-next-line no-template-curly-in-string
var castingFunctionError = sx.lazyTemplate('Error: value: [${value}] is not a valid ${type}');

module.exports = {
    take: function take(_take) {
        return function (values) {
            return [].concat((0, _toConsumableArray3.default)(F.take(parseInt(_take, 10) || Number.POSITIVE_INFINITY, values)));
        };
    },
    skip: function skip(_skip) {
        return function (values) {
            return [].concat((0, _toConsumableArray3.default)(F.skip(parseInt(_skip, 10) || 0, values)));
        };
    },
    slice: F.slice,
    split: function split(delimiter) {
        return function (str) {
            return str.split(delimiter);
        };
    },
    asDate: function asDate(value) {
        return new Date(value);
    },
    asInt: function asInt(value) {
        var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
        return parseInt(value, base);
    },
    asFloat: function asFloat(value) {
        var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
        return parseFloat(value, base);
    },
    asBool: function asBool(value) {
        return value === 'true' ? true : value === 'false' ? false : null;
    },
    asArray: function asArray(value) {
        var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
        return value.split(delimiter);
    },
    orNull: function orNull(value) {
        return value || null;
    },
    of: function of(key) {
        return function (o) {
            return o[key] !== undefined ? o[key] : F.reduced(o);
        };
    },
    // eslint-disable-next-line eqeqeq
    has: function has(path) {
        return function (o) {
            return jp.value(o, path) != undefined ? o : F.reduced(o);
        };
    },
    flatten: F.flatten,
    doubleFlatten: function doubleFlatten(enumerable) {
        return F.flatten(F.map(F.flatten, enumerable));
    },
    isNaN: isNaN,
    now: function now() {
        return new Date();
    },
    nowAsISO6601: function nowAsISO6601() {
        return new Date().toISOString();
    },
    nowAsDateString: function nowAsDateString() {
        return new Date().toDateString();
    },
    // nowAsFormat:
    uuid: function uuid() {
        return _uuid.v4();
    },
    hash: function hash(payload) {
        return md5(JSON.stringify(payload, null, 0));
    },
    toBool: function toBool(value) {
        return ['true', 'yes', 'y'].includes(value ? value.toLowerCase() : value);
    },
    toInteger: function toInteger(value) {
        var result = parseInt(value, 10);
        return isNaN(result) ? castingFunctionError({ value: value, type: 'integer' }) : result;
    },
    toFloat: function toFloat(value) {
        var result = parseFloat(value, 10);
        return isNaN(result) ? castingFunctionError({ value: value, type: 'float' }) : result;
    },
    toString: function toString(value) {
        return value.toString();
    },
    stringify: function stringify(value) {
        var keys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var indent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 2;
        return JSON.stringify(value, keys, indent);
    },
    ellipsis: function ellipsis(maxLen) {
        return function (str) {
            return str.slice(0, maxLen - 3) + '...';
        };
    },
    toNull: function toNull(value) {
        return ['null', 'nil'].includes(value ? value.toLowerCase() : value) ? null : value;
    },
    trim: function trim(str) {
        return str.trim();
    },
    toLowerCase: function toLowerCase(value) {
        return value ? value.toLowerCase() : value;
    },
    toUpperCase: function toUpperCase(value) {
        return value ? value.toUpperCase() : value;
    },
    not: function not(value) {
        return !value;
    },
    equals: function equals(source) {
        return function (target) {
            return target === source;
        };
    },
    gt: function gt(source) {
        return function (target) {
            return target > source;
        };
    },
    gte: function gte(source) {
        return function (target) {
            return target >= source;
        };
    },
    lt: function lt(source) {
        return function (target) {
            return target < source;
        };
    },
    lte: function lte(source) {
        return function (target) {
            return target <= source;
        };
    },
    inList: function inList(lst) {
        return function (target) {
            return JSON.parse(lst).includes(target);
        };
    },
    isEven: function isEven(source) {
        return source % 2 === 0;
    },
    isOdd: function isOdd(source) {
        return source % 2 !== 0;
    },
    add: function add(source) {
        return function (target) {
            return parseFloat(source, 10) + target;
        };
    },
    sub: function sub(source) {
        return function (target) {
            return target - parseFloat(source, 10);
        };
    },
    div: function div(source) {
        return function (target) {
            return target / parseFloat(source, 10);
        };
    },
    remainder: function remainder(source) {
        return function (target) {
            return target / parseFloat(source, 10);
        };
    },
    pow: function pow(source) {
        return function (target) {
            return Math.pow(target, parseFloat(source, 10));
        };
    },
    mul: function mul(source) {
        return function (target) {
            return parseFloat(source, 10) * target;
        };
    },
    matches: function matches(source) {
        return function (target) {
            return new RegExp(target).test(source);
        };
    },
    reducer: F.reduced,
    unreduced: F.unreduced,
    done: F.reduced,
    undone: F.unreduced
};