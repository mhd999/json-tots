'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var F = require('functional-pipelines');

var sx = require('../../../src/core/strings');

var fullPlaceholderRegex = /{([^{]*?)?{(.*?)}([^}]*)?}/gm;

var placeholder = { full: fullPlaceholderRegex };

var WS = '\\s*'; // '[\s\t\r\n]*';
var OWS = '\\s*\\|?\\s*'; // '[\s\t\r\n\|,;]*';
var SYMBOL = '[a-zA-Z0-9_\\-\\$\\.\\[\\]"\\s]*';
var SOURCE_NAME = '["]?[a-zA-Z0-9_\\s\\-\\$]*["]?';

var ARG_SEPARATOR = '\\s*\\:\\s*';
var ARG_NAME = '[a-zA-Z0-9_\\s-\\$\\.]*';

var inception = '(\\.\\*|\\.{2,}|\\.\\d{1,2}|>\\*|>{2,}|>\\d{1,2}|%\\*|%{2,}|%\\d{1,2})?';
var enumeration = '(\\*{1,2})?';
var symbol = '(:' + SYMBOL + '|[#|@]' + SYMBOL + ')?';
// const symbol = /((?:\:[a-zA-Z0-9_\-\$\.\[\]"\s]*(?:\s*\:\s*[a-zA-Z0-9_\s-\$\.]*)*)*|[#|@][a-zA-Z0-9_\-\$\.\[\]"\s]*)?/g;
// const symbol = `((?:\\:${SYMBOL}${ARG_SEPARATOR}${ARG_NAME})*|[#|@]${SYMBOL})?`;
var constraint = '([!|\\?](?:[=|~]' + SYMBOL + '(?:' + WS + '\\:' + WS + SOURCE_NAME + ')*)?)?';
var query = '((?:\\+|\\-)\\d*)?';

var operators = '' + WS + inception + OWS + enumeration + OWS + symbol + OWS + constraint + OWS + query + OWS;
var operatorsRegex = new RegExp(operators, 'g'); // consider multi line flag `m`, unicode `u` and sticky `y`
placeholder.operators = operatorsRegex;

placeholder.operatorNames = ['inception', 'enumerate', 'symbol', 'constraints', 'query'];

var PIPE_SEPARATOR = '\\s*\\|\\s*';
var FUNCTION_NAME = '[a-zA-Z0-9_\\-\\$\\.]+';
var SPREAD_OPERATOR = '\\*{1,2}';

var pipes = '(?:' + PIPE_SEPARATOR + ')((?:' + FUNCTION_NAME + '|' + SPREAD_OPERATOR + ')(?:' + ARG_SEPARATOR + ARG_NAME + ')*)'; // https://regex101.com/r/n2qnj7/6
var pipesRegex = new RegExp(pipes, 'g'); // consider multi line flag `m`, unicode `u` and sticky `y`
placeholder.pipes = pipesRegex;

/**
 * regex place holder, a.k.a reph parser
 *
 * NOTE: the source placeholder can be repeated within the template-string, e.g. "{{x.y}} = {{x.y}}"
 * reph() would consume one only, effectively optimizing by removing the need to deref twice within the same scope
 * later when the dereffed value is replaced in the string, a //g regex is used and would cover all identical occurrences
 *
 * @param source
 * @param operators
 * @param path
 * @param pipes
 * @param meta
 * @returns {*}
 */
var reph = function reph() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [],
        _ref2 = (0, _slicedToArray3.default)(_ref, 2),
        source = _ref2[0],
        _ref2$ = _ref2[1];

    _ref2$ = _ref2$ === undefined ? [] : _ref2$;

    var _ref2$2 = (0, _slicedToArray3.default)(_ref2$, 3),
        _ref2$2$ = _ref2$2[0];

    _ref2$2$ = _ref2$2$ === undefined ? [] : _ref2$2$;

    var _ref2$2$2 = (0, _slicedToArray3.default)(_ref2$2$, 1),
        operators = _ref2$2$2[0],
        _ref2$2$3 = _ref2$2[1];

    _ref2$2$3 = _ref2$2$3 === undefined ? [] : _ref2$2$3;

    var _ref2$2$4 = (0, _slicedToArray3.default)(_ref2$2$3, 1),
        path = _ref2$2$4[0],
        _ref2$2$5 = _ref2$2[2];

    _ref2$2$5 = _ref2$2$5 === undefined ? [] : _ref2$2$5;

    var _ref2$2$6 = (0, _slicedToArray3.default)(_ref2$2$5, 1),
        pipes = _ref2$2$6[0];

    var meta = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var ast = { source: source, value: null, '@meta': meta };

    if (F.isEmptyValue(path)) {
        ast.value = source;
        return F.reduced(ast);
    }

    ast['@meta']++;

    if (operators) {
        operators = sx.tokenize(placeholder.operators, operators, { tokenNames: placeholder.operatorNames });
        operators['@meta'] = ++ast['@meta'];
        ast.operators = operators;
    }

    if (pipes) {
        pipes = sx.tokenize(placeholder.pipes, pipes, { sequence: true });
        pipes['@meta'] = ++ast['@meta'];
        ast.pipes = pipes;
    }
    return (0, _extends3.default)({}, ast, { path: path });
};

function rephs(text) {
    var meta = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var ast = { source: text, value: null, '@meta': meta };
    var regex = new RegExp(placeholder.full.source, 'g');
    var matches = sx.tokenize(regex, text, { $n: false, sequence: true, cgindex: true, cgi0: true });

    if (F.isEmptyValue(matches)) {
        ast.value = text;
        return F.reduced(ast);
    }

    return F.map(reph, F.iterator(matches, { indexed: true, kv: true }));
}

module.exports = {
    operatorsRegex: operatorsRegex,
    operators: operatorsRegex.source,
    pipesRegex: pipesRegex,
    pipes: pipesRegex.source,
    fullPlaceholderRegex: fullPlaceholderRegex,
    fullPlaceholder: fullPlaceholderRegex.source,
    parse: rephs
};