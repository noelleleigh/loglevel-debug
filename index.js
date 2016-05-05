var BROWSER = typeof window !== 'undefined';
var GLOBAL = BROWSER ? window : global;
var DEBUG = BROWSER ? GLOBAL.DEBUG : process.env.DEBUG;

module.exports = factory;

var skips = [];
var names = [];

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */
function enable(namespaces) {
  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = skips.length; i < len; i++) {
    if (skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = names.length; i < len; i++) {
    if (names[i].test(name)) {
      return true;
    }
  }
  return false;
}

function factory(log) {
  var originalFactory = log.methodFactory;
  log.methodFactory = function (methodName, logLevel, loggerName) {
    if(enabled(loggerName)) {
      var rawMethod = originalFactory(methodName, logLevel, loggerName);
      return function(message) {
        rawMethod(loggerName + ": " + message);
      };
    }
    else {
      return function() {};
    };
  };

  if (!!DEBUG) {
    enable(DEBUG);
    logLevel = log.levels.DEBUG;
  }
  else {
    logLevel = log.levels.WARN;
  }
  log.setLevel(logLevel);

  return log;
}