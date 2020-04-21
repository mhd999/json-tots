"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _marked = /*#__PURE__*/_regenerator2.default.mark(slyd);

function slyd(fn) {
    var len = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : fn.length;
    var args, batch;
    return _regenerator2.default.wrap(function slyd$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    args = [];

                case 1:
                    if (!true) {
                        _context.next = 16;
                        break;
                    }

                    if (!(args.length < len)) {
                        _context.next = 13;
                        break;
                    }

                    _context.t0 = [];
                    _context.t1 = _toConsumableArray3.default;
                    _context.next = 7;
                    return;

                case 7:
                    _context.t2 = _context.sent;
                    _context.t3 = (0, _context.t1)(_context.t2);
                    batch = _context.t0.concat.call(_context.t0, _context.t3);

                    args.push.apply(args, (0, _toConsumableArray3.default)(batch));
                    _context.next = 14;
                    break;

                case 13:
                    return _context.abrupt("return", fn.apply(undefined, args));

                case 14:
                    _context.next = 1;
                    break;

                case 16:
                case "end":
                    return _context.stop();
            }
        }
    }, _marked, this);
}

function spinslyd(fn) {
    var gen = slyd(fn);

    gen.next();

    return function turn() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _gen$next = gen.next(args),
            done = _gen$next.done,
            value = _gen$next.value; // two way communication with the generator (::)

        return done ? value : turn;
    };
}

module.exports = {
    curryUntil: spinslyd,
    satisfy: spinslyd,
    spinslyd: spinslyd
};