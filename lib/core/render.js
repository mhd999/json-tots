'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _toArray2 = require('babel-runtime/helpers/toArray');

var _toArray3 = _interopRequireDefault(_toArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-useless-escape */

var jp = require('jsonpath');
var F = require('functional-pipelines');
var sx = require('./strings');
var operators = require('./operators');

var Fb = require('./times');
var parser = require('./peg/parser');

var rejectPlaceHolder = { open: '{!!{', close: '}!!}' };

function renderString(node, derefedList) {
    var rendered = void 0;
    if (derefedList.length === 1 && derefedList[0].source === node) {
        rendered = derefedList[0].value; // stand alone '{{path}}' expands to value, without toString conversion
    } else {
        var replace = function replace(acc, _ref) {
            var source = _ref.source,
                value = _ref.value;
            return acc.replace(new RegExp(sx.escapeStringForRegex(source), 'g'), value !== undefined ? value : '');
        };
        rendered = F.reduce(replace, function () {
            return node;
        }, derefedList);
    }
    return rendered;
}

function renderStringNode(contextRef) {
    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref2$meta = _ref2.meta,
        meta = _ref2$meta === undefined ? 0 : _ref2$meta,
        _ref2$sources = _ref2.sources,
        sources = _ref2$sources === undefined ? { default: {} } : _ref2$sources,
        _ref2$tags = _ref2.tags,
        tags = _ref2$tags === undefined ? {} : _ref2$tags,
        _ref2$functions = _ref2.functions,
        functions = _ref2$functions === undefined ? {} : _ref2$functions,
        _ref2$args = _ref2.args,
        args = _ref2$args === undefined ? {} : _ref2$args,
        config = _ref2.config;

    var refList = void 0;
    try {
        refList = parser.parse(contextRef.node);
    } catch (error) {
        return { rendered: contextRef.node };
    }

    var derefedList = F.map(operators.applyAll({
        meta: meta,
        sources: sources,
        tags: tags,
        functions: functions,
        args: args,
        context: contextRef,
        config: config
    }), refList);
    var rendered = renderString(contextRef.node, derefedList);
    return { rendered: rendered, asts: derefedList };
}

function renderFunctionExpressionNode(contextRef) {
    var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref3$meta = _ref3.meta,
        meta = _ref3$meta === undefined ? 0 : _ref3$meta,
        _ref3$sources = _ref3.sources,
        sources = _ref3$sources === undefined ? { default: {} } : _ref3$sources,
        _ref3$tags = _ref3.tags,
        tags = _ref3$tags === undefined ? {} : _ref3$tags,
        _ref3$functions = _ref3.functions,
        functions = _ref3$functions === undefined ? {} : _ref3$functions,
        _ref3$args = _ref3.args,
        args = _ref3$args === undefined ? {} : _ref3$args,
        config = _ref3.config;

    var document = arguments[2];

    // eslint-disable-next-line no-template-curly-in-string
    var missingFunctionError = sx.lazyTemplate('Error: No such builtin function: [${node}]');
    var evaluateArgs = operators.normalizeArgs({ functions: functions, args: args });
    var node = contextRef.node;

    var _node$slice$split = node.slice(1).split(operators.regex.PIPE),
        _node$slice$split2 = (0, _toArray3.default)(_node$slice$split),
        fnName = _node$slice$split2[0],
        fnExprs = _node$slice$split2.slice(1);

    var fn = functions[fnName] || (config.throws ? function () {
        throw new Error(missingFunctionError({ node: node }));
    } : F.lazy(missingFunctionError({ node: node })));

    var fnPipeline = F.pipes.apply(F, [fn].concat((0, _toConsumableArray3.default)(F.map(function (fnExpr) {
        var _fnExpr$split = fnExpr.split(operators.regex.fnArgsSeparator),
            _fnExpr$split2 = (0, _toArray3.default)(_fnExpr$split),
            fnName = _fnExpr$split2[0],
            args = _fnExpr$split2.slice(1);

        if (!(fnName in functions)) {
            throw new Error('could not resolve function name [' + fnName + ']'); // @TODO: Alternatives to throwing inside a mapping!!!!
        }

        var phIndex = args.indexOf('__');
        var fn = (0, _extends3.default)({}, functions, { '*': operators.flatten, '**': operators.doubleFlatten })[fnName];

        if (phIndex > 0) {
            args[phIndex] = F.__;
            fn = F.oneslot(functions[fnName]);
        }

        return args.length ? fn.apply(undefined, (0, _toConsumableArray3.default)(args)) : fn;
    }, fnExprs))));

    var fnArgKeys = ['$.' + contextRef.path.join('.'), contextRef.path.slice(-1).pop(), fnName];
    var argList = evaluateArgs(fnArgKeys, document);

    return { rendered: F.reduced(fnPipeline.apply(undefined, (0, _toConsumableArray3.default)(argList))) };
}

function transduception(enumerable, options) {
    var ast = enumerable.metadata();
    return operators.inception(options)(ast, enumerable);
}

function renderArrayNode(contextRef, options) {
    var NONE = {};
    var isString = function isString(x) {
        return F.isString(x) ? x : F.reduced(NONE);
    };
    var hasReph0 = function hasReph0(x) {
        var refList = void 0;
        try {
            refList = parser.parse(x);
            return refList[0];
        } catch (error) {
            return F.reduced(NONE);
        }
        // return F.isReduced(refList) ? F.reduced(NONE) : refList[0];
    };

    var hasInception = function hasInception(ast) {
        return jp.value(ast, '$.operators.inception') ? ast : F.reduced(NONE);
    };

    var partitionFn = F.composes(function (ast) {
        ast.medium = contextRef;
        return ast;
    }, operators.inceptionPreprocessor, hasInception, hasReph0, isString);
    var stickyWhen = function stickyWhen(x, _, ctx) {
        ctx.n = x.$depth ? x.$depth : ctx.n;
        return x.$depth !== undefined;
    };

    var partitionedGen = F.partitionBy(F.sticky(1, {
        when: stickyWhen,
        recharge: false
    })(partitionFn), contextRef.node);

    var _require = require('../transform'),
        transform = _require.transform; // lazy require to break cyclic dependency


    var lols = F.map(function (iter) {
        return iter.metadata().$depth ? transduception(iter, options) : F.map(function (item) {
            return transform(item, options)(options.sources.origin);
        }, iter);
    }, partitionedGen);
    return { rendered: F.flatten(lols), asts: {} };
}

module.exports = {
    renderString: renderString,
    renderStringNode: renderStringNode,
    renderFunctionExpressionNode: renderFunctionExpressionNode,
    renderArrayNode: renderArrayNode,
    data: {
        placeholder: parser.fullPlaceholderRegex,
        rejectPlaceHolder: rejectPlaceHolder
    }
};