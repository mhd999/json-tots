'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _marked = /*#__PURE__*/_regenerator2.default.mark(tokenGenerator);

/* eslint-disable eqeqeq */
/* eslint-disable no-eq-null */

var jp = require('jsonpath');
var F = require('functional-pipelines');

module.exports = {
    isString: F.isString,
    escapeStringForRegex: escapeStringForRegex,
    tokenGenerator: tokenGenerator,
    tokenize: tokenize,
    lazyTemplateTag: lazyTemplateTag,
    templatePlaceholders: templatePlaceholders,
    lazyTemplate: lazyTemplate
};

function escapeStringForRegex(str) {
    var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
    if (typeof str !== 'string') {
        throw new TypeError('Expected a string, received ' + (typeof str === 'undefined' ? 'undefined' : (0, _typeof3.default)(str)));
    }

    return str.replace(matchOperatorsRe, '\\$&');
}

function _tokenize(regex, str) {
    var tokenNames = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var $n = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

    regex = regex instanceof RegExp ? regex : new RegExp(regex);
    var result = {};
    var matches = void 0;

    var _loop = function _loop() {
        var match = matches.shift();
        matches.reduce(function (acc, captureGroup, index) {
            acc[tokenNames[index] || ($n ? '$' + (index + 1) : match)] = captureGroup;
            return acc;
        }, result);
    };

    while ((matches = regex.exec(str)) !== null) {
        _loop();
    }
    return result;
}

/**
 * When tokenizing there are two levels of capture groups matching
 * /g matches on the outside and list of capture groups on the inside
 * example: /{{(.*?)}} \/ {{(.*?)}}/g.exec('{{x.y}} / {{y.z}} - {{x.y}} / {{y.z}}')
 * @param strings
 * @param keys
 * @returns {function(...[*])}
 */
function tokenGenerator(regex, str) {
    var _this = this;

    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref$sequence = _ref.sequence,
        sequence = _ref$sequence === undefined ? false : _ref$sequence;

    var multi, matches, lastIndex, _loop2;

    return _regenerator2.default.wrap(function tokenGenerator$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    regex = new RegExp(regex); // normalize string and regex args, also refresh exhausted regex
                    multi = regex.flags.includes('g');
                    matches = regex.exec(str);

                    if (!(matches === null)) {
                        _context2.next = 5;
                        break;
                    }

                    return _context2.abrupt('return');

                case 5:
                    lastIndex = void 0;
                    _loop2 = /*#__PURE__*/_regenerator2.default.mark(function _loop2() {
                        var match;
                        return _regenerator2.default.wrap(function _loop2$(_context) {
                            while (1) {
                                switch (_context.prev = _context.next) {
                                    case 0:
                                        lastIndex = matches.index;
                                        match = matches.shift();
                                        // yield* matches/*.filter(token => !!token)*/.map(token => ({match, token})); // if we filter out undefined capture groups when the regex matches empty string we shift capture group identifiers!

                                        if (!sequence) {
                                            _context.next = 6;
                                            break;
                                        }

                                        return _context.delegateYield(matches.map(function (token, index) {
                                            return { match: match, token: token, cgi: index + 1 };
                                        }), 't0', 4);

                                    case 4:
                                        _context.next = 8;
                                        break;

                                    case 6:
                                        _context.next = 8;
                                        return matches;

                                    case 8:
                                    case 'end':
                                        return _context.stop();
                                }
                            }
                        }, _loop2, _this);
                    });

                case 7:
                    return _context2.delegateYield(_loop2(), 't0', 8);

                case 8:
                    if (multi && (matches = regex.exec(str)) !== null && matches.index !== lastIndex) {
                        _context2.next = 7;
                        break;
                    }

                case 9:
                case 'end':
                    return _context2.stop();
            }
        }
    }, _marked, this);
}

/**
 *
 * @param regex
 * @param str
 * @param tokenNames
 * @param $n
 * @param cgindex: capture group index
 * @param sequence
 * @returns {*}
 */
function tokenize(regex, str) {
    var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref2$tokenNames = _ref2.tokenNames,
        tokenNames = _ref2$tokenNames === undefined ? [] : _ref2$tokenNames,
        _ref2$$n = _ref2.$n,
        $n = _ref2$$n === undefined ? true : _ref2$$n,
        _ref2$cgindex = _ref2.cgindex,
        cgindex = _ref2$cgindex === undefined ? false : _ref2$cgindex,
        _ref2$cgi = _ref2.cgi0,
        cgi0 = _ref2$cgi === undefined ? false : _ref2$cgi,
        _ref2$sequence = _ref2.sequence,
        sequence = _ref2$sequence === undefined ? false : _ref2$sequence;

    if (sequence) {
        // interpolation, find all placeholders with the intention of later replacement, a placeholder might repeat, and there is no notion of $1 $2 as specific capture groups
        var tokenIter = F.iterator(tokenGenerator(regex, str, { sequence: sequence }), { indexed: true });
        return F.reduce(function (acc, _ref3) {
            var _ref4 = (0, _slicedToArray3.default)(_ref3, 2),
                _ref4$ = _ref4[0],
                match = _ref4$.match,
                token = _ref4$.token,
                cgi = _ref4$.cgi,
                index = _ref4[1];

            if (!cgindex && token == null) {
                return acc;
            }
            cgi = cgi0 ? cgi - 1 : cgi;
            // since index shift, lookup of aliases is not straight forward unless matched pattern is known upfront

            var key = tokenNames[cgindex ? cgi : index] || ($n ? '$' + (cgindex ? cgi : index + 1) : match);

            var incremental = $n && !cgindex;
            var groupByMatch = !$n;
            var groupByCgi = groupByMatch && cgindex;

            // effectively performing a double group by (match) (cgindex)
            if (acc[key]) {
                if (groupByCgi) {
                    if (acc[key][cgi]) {
                        acc[key][cgi] = [].concat((0, _toConsumableArray3.default)(acc[key][cgi]), [token]);
                    } else {
                        acc[key][cgi] = [token];
                    }
                } else if (groupByMatch) {
                    acc[key] = [].concat((0, _toConsumableArray3.default)(acc[key]), [token]);
                } else if ($n) {
                    acc[key] = token;
                } else {
                    throw new Error('WARNING: overwriting previous match');
                }
            } else if (groupByCgi) {
                acc[key] = [];
                acc[key][cgi] = [token];
            } else if (groupByMatch) {
                acc[key] = [token];
            } else /* if ($n)*/{
                    acc[key] = token;
                }
            return acc;
        }, function () {
            return {};
        }, tokenIter);
    } else {

        /**
         * currently this mode doesn't have the source (full-match)
         * capture groups oriented parser, with repeated multi-capture-group regex
         * with n slots (capture groups)
         * 1st match would be [cg1, undefined, undefined, ...]
         * 3nd match would be [undefined, undefined, cg3, ...]
         * ...
         * nth match would be [undefined, undefined, undefined, ..., cgn]
         **/

        var _tokenIter = F.iterator(tokenGenerator(regex, str));
        return F.reduce(function (acc, matches) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = matches.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref5 = _step.value;

                    var _ref6 = (0, _slicedToArray3.default)(_ref5, 2);

                    var index = _ref6[0];
                    var token = _ref6[1];

                    if (token == null) {
                        continue;
                    }
                    var key = tokenNames[index] || '$' + (index + 1);
                    // acc[key] = token;
                    acc[key] = acc[key] ? $n ? token : [].concat((0, _toConsumableArray3.default)(acc[key]), [token]) : $n ? token : [token];
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return acc;
        }, function () {
            return {};
        }, _tokenIter);
    }
}

function lazyTemplateTag(strings) {
    for (var _len = arguments.length, keys = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        keys[_key - 1] = arguments[_key];
    }

    return function () {
        for (var _len2 = arguments.length, values = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            values[_key2] = arguments[_key2];
        }

        var dict = values[values.length - 1] || {};
        var result = [strings[0]];
        keys.forEach(function (key, i) {
            var value = Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        });
        return result.join('');
    };
}

function templatePlaceholders(template) {
    var _ref7 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref7$placeholder = _ref7.placeholder;

    _ref7$placeholder = _ref7$placeholder === undefined ? {} : _ref7$placeholder;
    var _ref7$placeholder$ope = _ref7$placeholder.open,
        open = _ref7$placeholder$ope === undefined ? '${' : _ref7$placeholder$ope,
        _ref7$placeholder$clo = _ref7$placeholder.close,
        close = _ref7$placeholder$clo === undefined ? '}' : _ref7$placeholder$clo;

    // const regex = /\${['"]?(.*?)['"]?}/g;
    var open_ = escapeStringForRegex(open);
    var _close = escapeStringForRegex(close);

    var regex = new RegExp(open_ + '[\'"]?(.*?)[\'"]?' + _close, 'g');
    var matches = void 0;
    var mapping = {};
    // exec returns a single match, to get all matches you have to loop
    while ((matches = regex.exec(template)) !== null) {
        mapping[matches[1]] = matches[0];
    }
    if (!Object.keys(mapping).length) {
        throw new Error('Template has no parameters matching ' + regex.source);
    }
    return mapping;
}

function lazyTemplate(template, options) {
    var mapping = templatePlaceholders(template, options);
    return function (parameters) {
        for (var key in parameters) {
            if (mapping[key]) {
                var keyRegex = new RegExp(escapeStringForRegex(mapping[key]), 'g');
                template = template.replace(keyRegex, parameters[key]);
            }
        }
        return template;
    };
}