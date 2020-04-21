'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var F = require('functional-pipelines');

// JSON.stringify return empty object for Error otherwise
if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function value() {
            var alt = {};

            Object.getOwnPropertyNames(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },

        configurable: true,
        writable: true
    });
}

function log() {
    var _console;

    for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
        params[_key] = arguments[_key];
    }

    (_console = console).log.apply(_console, (0, _toConsumableArray3.default)(serialize.apply(undefined, [4].concat(params))));
}

function peek() {
    for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        params[_key2] = arguments[_key2];
    }

    log.apply(undefined, params);
    return params.length === 1 ? params[0] : params;
}

function logLine() {
    var _console2;

    for (var _len3 = arguments.length, params = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        params[_key3] = arguments[_key3];
    }

    (_console2 = console).log.apply(_console2, (0, _toConsumableArray3.default)(serialize.apply(undefined, [0].concat(params))));
}

function error() {
    var _console3;

    for (var _len4 = arguments.length, params = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        params[_key4] = arguments[_key4];
    }

    (_console3 = console).error.apply(_console3, ['Error:'].concat((0, _toConsumableArray3.default)(serialize.apply(undefined, [4].concat(params)))));
}

function serialize(indent) {
    for (var _len5 = arguments.length, params = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        params[_key5 - 1] = arguments[_key5];
    }

    return params.map(stringify(indent));
}

var stringify = function stringify(indent) {
    return function (value) {
        return F.isString(value) ? value : JSON.stringify(value, null, indent);
    };
};

var repeat = function repeat(str) {
    return function (count) {
        var _marked = /*#__PURE__*/_regenerator2.default.mark(generate);

        function generate() {
            return _regenerator2.default.wrap(function generate$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!count) {
                                _context.next = 6;
                                break;
                            }

                            _context.next = 3;
                            return str;

                        case 3:
                            count--;
                            _context.next = 0;
                            break;

                        case 6:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _marked, this);
        }
        return [].concat((0, _toConsumableArray3.default)(generate())).join('');
    };
};

var line = function line(count) {
    var sym = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '-';
    return console.log(repeat(sym)(count));
};

module.exports = {
    log: log,
    peek: peek,
    error: error,
    repeat: repeat,
    logLine: logLine,
    line: line,
    time: function time(label) {
        return console.time(label);
    },
    timeEnd: function timeEnd(label) {
        return console.timeEnd(label);
    }
};