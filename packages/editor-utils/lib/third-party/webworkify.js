"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
var stringify = JSON.stringify;

function _default(fn, options) {
  var bundleFn = arguments[3];
  var sources = arguments[4];
  var cache = arguments[5];
  var wkey;
  var cacheKeys = Object.keys(cache);

  for (var i = 0, l = cacheKeys.length; i < l; i++) {
    var key = cacheKeys[i];
    var exp = cache[key].exports;

    if (exp === fn || exp && exp.default === fn) {
      wkey = key;
      break;
    }
  }

  if (!wkey) {
    wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
    var wcache = {};

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
      var key = cacheKeys[i];
      wcache[key] = key;
    }

    sources[wkey] = ['function(require,module,exports){' + fn + '(self); }', wcache];
  }

  var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
  var scache = {};
  scache[wkey] = wkey;
  sources[skey] = ['function(require,module,exports){' + 'var f = require(' + stringify(wkey) + ');' + '(f.default ? f.default : f)(self);' + '}', scache];
  var workerSources = {};
  resolveSources(skey);

  function resolveSources(key) {
    workerSources[key] = true;

    for (var depPath in sources[key][1]) {
      var depKey = sources[key][1][depPath];

      if (!workerSources[depKey]) {
        resolveSources(depKey);
      }
    }
  }

  var src = '(' + bundleFn + ')({' + Object.keys(workerSources).map(function (key) {
    return stringify(key) + ':[' + sources[key][0] + ',' + stringify(sources[key][1]) + ']';
  }).join(',') + '},{},[' + stringify(skey) + '])';
  var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
  var blob = new Blob([src], {
    type: 'text/javascript'
  });

  if (options && options.bare) {
    return blob;
  }

  var workerUrl = URL.createObjectURL(blob);
  var worker = new Worker(workerUrl);
  worker.objectURL = workerUrl;
  return worker;
}

;