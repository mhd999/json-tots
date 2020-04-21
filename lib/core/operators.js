'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-param-reassign */
/* eslint-disable curly */
/* eslint-disable no-magic-numbers */
/* eslint-disable no-implicit-coercion */
/* eslint-disable no-useless-escape */
var jp = require('jsonpath');
var F = require('functional-pipelines');
var Fb = require('./times');
var bins = require('./builtins');
var sx = require('./strings');

var sortBy = function sortBy(keyName) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$mapping = _ref.mapping,
        mapping = _ref$mapping === undefined ? function (v) {
        return v;
    } : _ref$mapping,
        _ref$asc = _ref.asc,
        asc = _ref$asc === undefined ? true : _ref$asc;

    return function (a, b) {
        if (!asc) {
            ;
            var _ref2 = [b, a];
            a = _ref2[0];
            b = _ref2[1];
        }return +(mapping(a[keyName]) > mapping(b[keyName])) || +(mapping(a[keyName]) === mapping(b[keyName])) - 1;
    };
};

var regex = {
    safeDot: /\.(?![\w\.]+")/,
    memberOrDescendant: /^[\[\.]/,
    fnArgsSeparator: /\s*:\s*/,
    PIPE: /\s*\|\s*/
};

// eslint-disable-next-line no-confusing-arrow
var jpify = function jpify(path) {
    return path.startsWith('$') ? path : regex.memberOrDescendant.test(path) ? '$' + path : '$.' + path;
};

var deref = function deref(sources) {
    return function (ast) {
        var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref3$meta = _ref3.meta,
            meta = _ref3$meta === undefined ? 1 : _ref3$meta,
            _ref3$source = _ref3.source,
            source = _ref3$source === undefined ? 'origin' : _ref3$source;

        var document = sources[source];
        var values = void 0;
        if (F.isNil(document)) {
            values = [];
        } else if (!F.isContainer(document)) {
            meta = 0;
            values = [document]; // literal value
        } else {
            values = jp.query(document, jpify(ast.path));
        }
        return (0, _extends3.default)({}, ast, { '@meta': meta, value: values });
    };
};

var query = function query(ast) {
    var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref4$meta = _ref4.meta,
        meta = _ref4$meta === undefined ? 2 : _ref4$meta;

    var queryOp = function queryOp(values) {
        return values.pop();
    };

    if (jp.value(ast, '$.operators.query')) {

        var ops = {
            '+': function _(ast) {
                return function (count) {
                    return function (values) {
                        return bins.take(count)(values);
                    };
                };
            },
            '-': function _(ast) {
                return function (count) {
                    return function (values) {
                        return count ? bins.skip(count)(values) : values.pop();
                    };
                };
            } // semantics of standalone - are not yet defined
        };
        var _ast$operators$query = ast.operators.query,
            operator = _ast$operators$query.operator,
            count = _ast$operators$query.count;

        queryOp = ops[operator](ast)(count);
    }
    return (0, _extends3.default)({}, ast, { '@meta': meta, value: queryOp(ast.value) });
};

/**
 * NOTE: regex for constraint would allow for !abc or ?abc reserved for future use
 * @param sources
 * @param config
 * @returns {function(*=, {meta?: *}=): {"@meta": Number.meta}}
 */
var constraint = function constraint(_ref5) {
    var sources = _ref5.sources,
        config = _ref5.config;
    return function (ast) {
        var _ref6 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref6$meta = _ref6.meta,
            meta = _ref6$meta === undefined ? 2 : _ref6$meta;

        var ops = {
            '?': function _(ast) {
                return function (isAltLookup) {
                    var defaultSource = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'default';
                    var defaultValue = arguments[2];
                    return ast.value !== undefined ? ast : !F.isNil(defaultValue) ? (0, _extends3.default)({}, ast, {
                        value: defaultValue
                    }) : F.compose(query, deref(sources))(ast, { meta: meta, source: defaultSource });
                };
            },
            '!': function _(ast) {
                return function (isAltLookup, altSource, defaultValue) {
                    var result = ast;
                    result = !F.isEmptyValue(altSource) ? F.compose(query, deref(sources))(ast, {
                        meta: meta,
                        source: altSource
                    }) : (0, _extends3.default)({}, result, { value: F.isNil(ast.value) ? null : ast.value });
                    result = result.value !== undefined ? result : !F.isNil(defaultValue) ? (0, _extends3.default)({}, result, {
                        value: defaultValue // @TODO: check why it converts to string even if it's standalone
                    }) : (0, _extends3.default)({}, result, { value: null
                    });
                    return result;
                };
            }
        };
        // eslint-disable-next-line prefer-const
        var _ast$operators$constr = ast.operators.constraint,
            operator = _ast$operators$constr.operator,
            equal = _ast$operators$constr.equal,
            source = _ast$operators$constr.source,
            defaultValue = _ast$operators$constr.defaultValue;

        var result = ops[operator](ast)(equal === '=', source, defaultValue);
        return (0, _extends3.default)({}, result, { '@meta': meta });
    };
};

var constraintOperator = function constraintOperator(_ref7) {
    var sources = _ref7.sources;
    return F.composes(constraint({
        sources: sources
    }), bins.has('$.operators.constraint'));
};

var symbol = function symbol(_ref8) {
    var tags = _ref8.tags,
        context = _ref8.context,
        sources = _ref8.sources;
    return function (ast) {
        var _ref9 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref9$meta = _ref9.meta,
            meta = _ref9$meta === undefined ? 2 : _ref9$meta;

        var ops = {
            ':': function _(ast) {
                return function (sources, tag) {
                    sources['@@next'] = sources['@@next'] || [];
                    var job = {
                        type: '@@policy',
                        path: jp.stringify(context.path),
                        tag: tag,
                        source: ast.source,
                        templatePath: '',
                        tagPath: ast.path
                    };
                    sources['@@next'].push(job);
                    return (0, _extends3.default)({}, ast, { policy: tag });
                };
            },
            '#': function _(ast) {
                return function (sources, tag) {
                    tag = tag.trim();
                    var tagHandler = {
                        undefined: ast.path,
                        null: ast.path,
                        '': ast.path,
                        $: jp.stringify(context.path)
                    };
                    var path = tagHandler[tag];
                    if (path === undefined) {
                        path = tag;
                    }
                    tags[path] = ast.value;
                    // sources.tags = tags;
                    return (0, _extends3.default)({}, ast, { tag: path });
                };
            },
            '@': function _(ast) {
                return function (sources, tag) {
                    var ctx = tags[tag];
                    // Path rewrite
                    var relativeTagPath = ast.path[0] === '$' ? ast.path.slice(1) : ast.path;
                    var tagPath = '' + tag + (relativeTagPath[0] === '[' ? '' : relativeTagPath[0] ? '.' : '') + (relativeTagPath === '$' ? '' : relativeTagPath);
                    // Path rewrite
                    var value = void 0;
                    if (F.isEmptyValue(ctx)) {
                        value = ast.source;
                        sources['@@next'] = sources['@@next'] || [];
                        var job = {
                            type: '@@tag',
                            path: jp.stringify(context.path),
                            tag: tag,
                            source: ast.source,
                            templatePath: ast.path,
                            tagPath: tagPath
                        };
                        sources['@@next'].unshift(job);
                    } else {
                        // value = JSON.stringify({ ctx, path: ast.path, value: jp.value(tags, jpify(ast.path))}, null, 0);
                        value = jp.value(tags, jpify(tagPath)) || ctx;
                    }

                    ast.value = value;
                    return F.reduced((0, _extends3.default)({}, ast, { from: sources['tags'] }));
                };
            }
        };

        var _ast$operators$symbol = ast.operators.symbol,
            operator = _ast$operators$symbol.operator,
            tag = _ast$operators$symbol.tag;

        var result = ops[operator](ast)(sources, tag);
        return (0, _extends3.default)({}, result, { '@meta': meta });
    };
};

var symbolOperator = function symbolOperator(_ref10) {
    var tags = _ref10.tags,
        context = _ref10.context,
        sources = _ref10.sources,
        stages = _ref10.stages;
    return F.composes(symbol({
        tags: tags,
        context: context,
        sources: sources,
        stages: stages
    }), bins.has('$.operators.symbol'));
};

var enumerate = function enumerate(ast) {
    var _ref11 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref11$meta = _ref11.meta,
        meta = _ref11$meta === undefined ? 4 : _ref11$meta;

    var ops = {
        '*': function _(ast) {
            return (0, _extends3.default)({}, ast, { value: [].concat((0, _toConsumableArray3.default)(F.iterator(ast.value))) });
        }, // no-op on arrays, enumerates object values in Object.keys order
        '**': function _(ast) {
            return (0, _extends3.default)({}, ast, { value: [].concat((0, _toConsumableArray3.default)(F.iterator(ast.value, { indexed: true, kv: true }))) });
        } // TODO: do scenarios of ** python style k/v pairs expansion fit with jsonpath?
    };

    var _ast$operators$enumer = ast.operators.enumerate,
        operator = _ast$operators$enumer.operator,
        repeat = _ast$operators$enumer.repeat;

    var result = ops[repeat === 1 ? operator : operator + operator](ast);
    return (0, _extends3.default)({}, result, { '@meta': meta });
};

var enumerateOperator = F.composes(enumerate, bins.has('$.operators.enumerate'));

var parseTextArgs = function parseTextArgs() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    var parseNumeric = function parseNumeric(text) {
        var isIntText = /^\d+$/;
        var isFloatText = /^\d+\.\d+$/;

        if (isFloatText.test(text)) {
            return parseFloat(text, 10);
        } else if (isIntText.test(text)) {
            return parseInt(text, 10);
        } else {
            return text;
        }
    };

    var literals = {
        true: true,
        false: false,
        null: null,
        undefined: undefined,
        __: F.__
    };

    var parseText = function parseText(text) {
        return text in literals ? literals[text] : parseNumeric(text);
    }; // When regex or parser allows for foo:[1, 2, 3], add: || JSON.parse(text);

    return F.map(parseText, args);
};

var normalizeArgs = function normalizeArgs(_ref12) {
    var functions = _ref12.functions,
        args = _ref12.args;
    return function (_ref13, data) {
        var _ref14 = (0, _slicedToArray3.default)(_ref13, 3),
            fnPath = _ref14[0],
            fnKey = _ref14[1],
            fnName = _ref14[2];

        var fnArgs = args[fnPath] || args[fnKey] || args[fnName];
        if (fnArgs === undefined) return [];

        var fnArgList = F.isArray(fnArgs) ? fnArgs : [fnArgs];

        var argList = F.map(function (arg) {
            return arg.path ? jp.value(data, arg.path) : arg.value !== undefined ? arg.value : arg;
        }, fnArgList);

        return argList;
    };
};

var pipe = function pipe(_ref15) {
    var functions = _ref15.functions,
        extendedArgs = _ref15.args,
        sources = _ref15.sources,
        context = _ref15.context;
    return function (ast) {
        var _ref16 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref16$meta = _ref16.meta,
            meta = _ref16$meta === undefined ? 5 : _ref16$meta;

        var pipes = ast.pipes;

        if (pipes.length === 0) return ast;

        // ordered [['$1', 'toInt:arg1:arg2'], ['$2', 'isEven:arg1:arg2']]
        var fnPipeline = F.map(function (_ref17) {
            var functionName = _ref17.function,
                _ref17$type = _ref17.type,
                type = _ref17$type === undefined ? 'inline' : _ref17$type,
                _ref17$args = _ref17.args,
                args = _ref17$args === undefined ? [] : _ref17$args;

            // eslint-disable-next-line prefer-const
            var enrichedFunctions = (0, _extends3.default)({}, functions, { '*': bins.flatten, '**': bins.doubleFlatten });
            if (!(functionName in enrichedFunctions)) {
                throw new Error('could not resolve function name [' + functionName + ']'); // @TODO: Alternatives to throwing inside a mapping!!!!
            }

            var fn = enrichedFunctions[functionName];

            if (type === 'extended') {
                var fnArgKeys = ['$.' + context.path.join('.'), context.path.slice(-1).pop(), functionName];
                var argList = normalizeArgs({ functions: functions, args: extendedArgs })(fnArgKeys, sources['origin']); // sources['origin'] === document
                return fn.apply(undefined, (0, _toConsumableArray3.default)(argList)); // {{} | @foo } here foo is a higher order function, (...extendedArgs) => nodeValue => {}
            } else {

                /*
                * A function accepting an argument should return a function of arity one that receives the value rendered
                * example: take(n)(data), parseInt(base)(data), etc ...
                */

                /**
                 * For functions of arity > 1, the engine supports one slot (only) syntax @TODO: support multiple slots
                 * example: equals:100:__
                 *
                 */
                var phIndex = args.indexOf('__');
                if (phIndex >= 0) {
                    // args[phIndex] = F.__;
                    fn = F.oneslot(fn).apply(undefined, (0, _toConsumableArray3.default)(parseTextArgs.apply(undefined, (0, _toConsumableArray3.default)(args)))); // placeholder functions are normal functions, since renderedValue is passed into placeholder position with F.oneslot, which already creates a higher order function
                    return fn;
                } else if (args.length === 0) {
                    return fn; // no args functions are normal functions that receive the renderedValue
                } else {
                    var fn2 = fn.apply(undefined, (0, _toConsumableArray3.default)(parseTextArgs.apply(undefined, (0, _toConsumableArray3.default)(args))));
                    return F.isFunction(fn2) ? fn2 : F.lazy(fn2);
                }
            }
        }, pipes);

        return (0, _extends3.default)({}, ast, { '@meta': meta, value: F.pipe.apply(F, (0, _toConsumableArray3.default)(fnPipeline))(ast.value) }); // we would love to unleash pipes (short circuit pipe), but current implementation would unreduce value reduced by functions. @TODO revisit later
    };
};

var pipeOperator = function pipeOperator(_ref18) {
    var functions = _ref18.functions,
        args = _ref18.args,
        sources = _ref18.sources,
        context = _ref18.context;
    return F.composes(pipe({ functions: functions, args: args, sources: sources, context: context }), bins.has('$.pipes'));
};

/**
 * op = [ .+ | .N | >+ | >N | %+ | %N ]
 * .. : lens composition inception
 * >> : for each child, apply transform with leader node
 * %% : zip transform, positional template from leader node renders child template at the same position
 * @param ast
 * @returns {{operator, repeat: *}}
 */
var inception = function inception(options) {
    return function (ast, enumerable) {
        var _ref19 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
            _ref19$meta = _ref19.meta,
            meta = _ref19$meta === undefined ? 5 : _ref19$meta;

        var ops = {

            /**
             * Renders node n in current scope, render n+1 using n as scoped-document, effectively recurring into smaller scopes
             * @param ast
             * @param enumerable
             * @param options
             */
            '.': function _(ast, enumerable, options) {
                var _enumerable = (0, _slicedToArray3.default)(enumerable, 1),
                    inceptionNode = _enumerable[0];

                var _require = require('../transform'),
                    transform = _require.transform; // lazy require to break cyclic dependency


                var scopedDocument = transform(inceptionNode, options)(options.sources.origin);
                return [F.reduce(function (rendered, nestedTemplate) {
                    return transform(nestedTemplate, options)(rendered);
                }, function () {
                    return scopedDocument;
                }, enumerable)];
            },

            /**
             * Renders the leader node, use the rendered value as a scoped-document to render the rest of the enumerable as templates
             * @param ast
             * @param enumerable
             * @param options
             */
            '>': function _(ast, enumerable, options) {
                var _enumerable2 = (0, _slicedToArray3.default)(enumerable, 1),
                    inceptionNode = _enumerable2[0];

                var _require2 = require('../transform'),
                    transform = _require2.transform; // lazy require to break cyclic dependency


                var scopedDocument = transform(inceptionNode, options)(options.sources.origin);
                return F.map(function (item) {
                    return transform(item, options)(scopedDocument);
                }, enumerable);
            },

            /**
             * Renders the leader node, which yields an array of documents, zip/render the array of templates aligning document(n) with template(n)
             * @param ast
             * @param enumerable
             * @param options
             */
            '%': function _(ast, enumerable, options) {
                var _enumerable3 = (0, _slicedToArray3.default)(enumerable, 1),
                    inceptionNode = _enumerable3[0];

                var _require3 = require('../transform'),
                    transform = _require3.transform; // lazy require to break cyclic dependency


                var scopedDocument = transform(inceptionNode, options)(options.sources.origin);
                if (!F.isArray(scopedDocument)) throw new Error('Inception Operator [%] should be used for template nodes yielding an array');
                var rest = [].concat((0, _toConsumableArray3.default)(enumerable));
                if (rest.length === 1) {
                    // no zip align, apply the rest-template for-each value in document
                    return F.map(function (documentItem) {
                        return transform(rest[0], options)(documentItem);
                    }, scopedDocument);
                } else {
                    // zip-align
                    var pairsIter = F.zip(rest, scopedDocument);
                    return F.map(function (_ref20) {
                        var _ref21 = (0, _slicedToArray3.default)(_ref20, 2),
                            template = _ref21[0],
                            document = _ref21[1];

                        return transform(template, options)(document);
                    }, pairsIter);
                }
            }
        };

        var operator = ast.operator,
            repeat = ast.repeat;

        var opFn = ops[operator];

        var result = opFn(ast, enumerable, options);
        return result; // enumerable
    };
};

var inceptionPreprocessor = function inceptionPreprocessor(ast) {
    // eslint-disable-next-line prefer-const
    var _ast$operators$incept = ast.operators.inception,
        operator = _ast$operators$incept.operator,
        repeat = _ast$operators$incept.repeat;

    repeat = repeat === '*' ? Number.POSITIVE_INFINITY : repeat;
    return (0, _extends3.default)({}, ast, { operator: operator, $depth: repeat });
};

var applyAll = function applyAll(_ref22) {
    var meta = _ref22.meta,
        sources = _ref22.sources,
        tags = _ref22.tags,
        functions = _ref22.functions,
        args = _ref22.args,
        context = _ref22.context,
        config = _ref22.config,
        stages = _ref22.stages;
    return F.composes(pipeOperator({ functions: functions, args: args, sources: sources, context: context }), enumerateOperator, symbolOperator({ tags: tags, context: context, sources: sources, stages: stages }), constraintOperator({ sources: sources, config: config }), query, deref(sources));
};

module.exports = {
    normalizeArgs: normalizeArgs,
    regex: regex,
    jpify: jpify,
    deref: deref,
    query: query,
    constraint: constraintOperator,
    symbol: symbolOperator,
    enumerate: enumerateOperator,
    inceptionPreprocessor: inceptionPreprocessor,
    inception: inception,
    pipe: pipeOperator,
    applyAll: applyAll,
    sortBy: sortBy
};