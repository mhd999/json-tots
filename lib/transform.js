'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable array-callback-return */

var traverse = require('traverse');
var jp = require('jsonpath');
var F = require('functional-pipelines');
var defaultConfig = {
    throws: false,
    nullifyMissing: true,
    operators: {
        constraints: {
            '?': {
                drop: true
            },
            '!': {
                nullable: true
            }
        }
    }
};
var bins = require('./core/builtins');

var _require = require('./core/render'),
    renderStringNode = _require.renderStringNode,
    renderFunctionExpressionNode = _require.renderFunctionExpressionNode,
    renderArrayNode = _require.renderArrayNode,
    renderData = _require.data;

var _require2 = require('./core/operators'),
    jpify = _require2.jpify;

var _require3 = require('./core/policy/key/run-policy'),
    runPolicy = _require3.runPolicy;

/**
 * Transforms JSON document using a JSON template
 * @param template Template JSON
 * @param sources A map of alternative document-sources, including `default` source
 * @param tags Reference to a map that gets populated with Tags
 * @param functions A map of user-defined function, if name-collision occurs with builtin functions, user-defined functions take precedence
 * @param args A map of extended arguments to @function expressions, args keys are either functionName (if used only once), functionKey (if globally unique) or functionPath which is unique but ugliest option to write
 * @param config Allows to override defaultConfig
 * @param builtins A map of builtin functions, defaults to ./core/builtins.js functions
 * @returns {function(*=): *}
 */


var transform = function transform(template) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$meta = _ref.meta,
        meta = _ref$meta === undefined ? 0 : _ref$meta,
        _ref$sources = _ref.sources,
        sources = _ref$sources === undefined ? { default: {} } : _ref$sources,
        _ref$tags = _ref.tags,
        tags = _ref$tags === undefined ? {} : _ref$tags,
        _ref$functions = _ref.functions,
        functions = _ref$functions === undefined ? {} : _ref$functions,
        _ref$args = _ref.args,
        args = _ref$args === undefined ? {} : _ref$args,
        _ref$config = _ref.config,
        config = _ref$config === undefined ? defaultConfig : _ref$config;

    var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref2$builtins = _ref2.builtins,
        builtins = _ref2$builtins === undefined ? bins : _ref2$builtins;

    return function (document) {
        var result = void 0;

        functions = (0, _extends3.default)({}, bins, functions);

        var options = {
            meta: meta,
            sources: (0, _extends3.default)({}, sources, { origin: document }),
            tags: tags,
            functions: functions,
            args: args,
            config: config
        };

        if (F.isString(template)) {
            var _renderStringNode = renderStringNode({ node: template, path: ['$'] }, options);

            result = _renderStringNode.rendered;
        } else {
            result = traverse(template).map(function (node) {
                var self = this;
                var contextRef = self;
                var rendered = void 0;
                var asts = void 0;

                if (F.isFunction(node)) {
                    rendered = node(document);
                } else if (F.isString(node)) {
                    if (node.startsWith('@')) {
                        var _renderFunctionExpres = renderFunctionExpressionNode(contextRef, options, document);

                        rendered = _renderFunctionExpres.rendered;
                    } else {
                        var _renderStringNode2 = renderStringNode(contextRef, options);

                        rendered = _renderStringNode2.rendered;
                        asts = _renderStringNode2.asts;
                    }
                } else if (F.isArray(node)) {
                    var _renderArrayNode = renderArrayNode(contextRef, options);

                    rendered = _renderArrayNode.rendered;
                    asts = _renderArrayNode.asts;
                } else {
                    rendered = node;
                }

                if (self.isRoot) {
                    return;
                }

                if (rendered === undefined) {
                    if (jp.value(config, '$.operators.constraints["?"].drop')) {
                        self.remove(true);
                    } else {
                        self.update(null);
                    }
                } else if (rendered === null) {
                    if (jp.value(config, '$.operators.constraints["!"].nullable')) {
                        self.update(null);
                    } else {
                        throw new Error('Missing required attribute: [' + jp.stringify(self.path) + ': ' + (asts ? asts[0].source : '') + ']');
                    }
                } else if (F.isReduced(rendered)) {
                    self.update(F.unreduced(rendered), true); // stopHere, don't traverse children
                } else {
                    self.update(rendered);
                }
            });
        }

        return result;
    };
};

var reRenderTags = function reRenderTags(template) {
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
        _ref3$config = _ref3.config,
        config = _ref3$config === undefined ? defaultConfig : _ref3$config;

    var _ref4 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref4$builtins = _ref4.builtins,
        builtins = _ref4$builtins === undefined ? bins : _ref4$builtins;

    return function (document) {
        return F.reduce(function (template, _ref5) {
            var path = _ref5.path,
                tag = _ref5.tag,
                source = _ref5.source,
                templatePath = _ref5.templatePath,
                tagPath = _ref5.tagPath;

            var value = tags[tagPath];
            var rendered = jp.value(template, path).replace(source, value);
            jp.value(template, path, rendered);
            return template;
        }, function () {
            return template;
        }, sources['@@next'].filter(function (job) {
            return job['type'] === '@@tag';
        }));
    };
};

var applyPolicies = function applyPolicies(template) {
    var _ref6 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref6$meta = _ref6.meta,
        meta = _ref6$meta === undefined ? 0 : _ref6$meta,
        _ref6$sources = _ref6.sources,
        sources = _ref6$sources === undefined ? { default: {} } : _ref6$sources,
        _ref6$tags = _ref6.tags,
        tags = _ref6$tags === undefined ? {} : _ref6$tags,
        _ref6$functions = _ref6.functions,
        functions = _ref6$functions === undefined ? {} : _ref6$functions,
        _ref6$args = _ref6.args,
        args = _ref6$args === undefined ? {} : _ref6$args,
        _ref6$config = _ref6.config,
        config = _ref6$config === undefined ? defaultConfig : _ref6$config;

    var _ref7 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref7$builtins = _ref7.builtins,
        builtins = _ref7$builtins === undefined ? bins : _ref7$builtins;

    return function (document) {
        return F.reduce(function (acc, _ref8) {
            var path = _ref8.path,
                tag = _ref8.tag,
                source = _ref8.source,
                templatePath = _ref8.templatePath,
                tagPath = _ref8.tagPath;

            var policy = jp.value(sources, jpify(tag));

            var _runPolicy = runPolicy(policy, acc, document)({ path: path, tag: tag, source: source, templatePath: templatePath, tagPath: tagPath }),
                rendered = _runPolicy.template,
                tPath = _runPolicy.templatePath;

            return rendered;
        }, function () {
            return template;
        }, sources['@@next'].filter(function (job) {
            return job['type'] === '@@policy';
        }));
    };
};

module.exports = {
    transform: transform,
    reRenderTags: reRenderTags,
    applyPolicies: applyPolicies,
    data: (0, _extends3.default)({}, renderData, {
        defaultConfig: defaultConfig
    })
};