'use strict';

function defered(x) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$ticks = _ref.ticks,
        ticks = _ref$ticks === undefined ? 1 : _ref$ticks;

    return x && x['@@tots/defered'] ? x : {
        '@@tots/value': x,
        '@@tots/defered': ticks
    };
}

function isDefered(x) {
    return x && x['@@tots/defered'] ? x['@@tots/defered'] : 0;
}

module.exports = {
    defered: defered,
    isDefered: isDefered
};