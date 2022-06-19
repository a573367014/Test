"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

const UGIF = function () {
  var a = function () {
    var j,
        F,
        c,
        b,
        H = 0,
        k = 0,
        Z = 0,
        P = 0,
        l = function () {
      var R = j >>> 3,
          i = F[R + 2] << 16 | F[R + 1] << 8 | F[R],
          M = i >>> (j & 7) & (1 << k) - 1;
      j += k;
      return M;
    },
        e = new Uint32Array(4096 * 4),
        V = 0,
        W = function (R) {
      if (R == V) return;
      V = R;
      Z = 1 << R;
      P = Z + 1;

      for (var i = 0; i < P + 1; i++) {
        e[4 * i] = e[4 * i + 3] = i;
        e[4 * i + 1] = 65535;
        e[4 * i + 2] = 1;
      }
    },
        G = function (R) {
      k = R + 1;
      H = P + 1;
    },
        Q = function (R) {
      var i = R << 2,
          M = e[i + 2],
          v = b + M - 1;

      while (i != 65535) {
        c[v--] = e[i];
        i = e[i + 1];
      }

      b += M;
    },
        L = function (R, i) {
      var M = H << 2,
          v = R << 2;
      e[M] = e[(i << 2) + 3];
      e[M + 1] = v;
      e[M + 2] = e[v + 2] + 1;
      e[M + 3] = e[v + 3];
      H++;
      if (H == 1 << k && k != 12) k++;
    },
        s = function (R, i, M, v, t, q) {
      j = i << 3;
      F = R;
      c = v;
      b = t;
      var g = i + M << 3,
          r = 0,
          p = 0;
      W(q);
      G(q);

      while (j < g && (r = l()) != P) {
        if (r == Z) {
          G(q);
          r = l();
          if (r == P) break;
          Q(r);
        } else {
          if (r < H) {
            Q(r);
            L(p, r);
          } else {
            L(p, p);
            Q(H - 1);
          }
        }

        p = r;
      }

      return b;
    };

    return s;
  }(),
      O,
      f,
      E = new Uint8Array(128),
      B = function () {
    return O[f++];
  },
      A = function () {
    var j = O[f + 1] << 8 | O[f];
    f += 2;
    return j;
  },
      U = function () {
    while (O[f] != 0) f += 1 + O[f];

    f++;
  },
      d = function (j) {
    O = new Uint8Array(j);
    f = 6;
    var F = A(),
        c = A(),
        b = B(),
        H = B(),
        k = B(),
        Z = b >>> 7,
        P = b >>> 4 & 7,
        X = b >>> 3 & 1,
        l = b >>> 0 & 7,
        m = f,
        e = 0,
        V,
        W = 0,
        G = 0,
        C = 0,
        z = 260;
    if (Z == 1) f += 3 * (1 << l + 1);
    var T = [];

    while (f < O.length) {
      var Q = B();

      if (Q == 33) {
        var L = B();

        if (L == 249) {
          var s = B(),
              b = B();
          W = b >>> 2 & 7;
          G = A();
          z = B();
          if ((b & 1) == 0) z = 260;
          B();
        } else if (L == 254) {
          U();
        } else if (L == 255) {
          U();
        } else throw L;
      } else if (Q == 44) {
        var R = A(),
            i = A(),
            M = A(),
            v = A(),
            t = B(),
            q = t >>> 7;
        C = t >>> 6 & 1;

        if (q == 1) {
          var l = t >>> 0 & 7;
          e = f;
          f += 3 * (1 << l + 1);
        }

        V = {
          x: R,
          y: i,
          a: M,
          O: v,
          f: W,
          delay: G,
          B: z,
          A: e == 0 ? m : e,
          U: C
        };
        T.push(V);
        e = 0;
      } else if (Q <= 8) {
        var M = V.a,
            v = V.O,
            S = M * v,
            Y = 0;
        if (E.length < S * 1.2) E = new Uint8Array(~~(S * 1.3));

        while (f < O.length && O[f] != 0) {
          var J = B();

          for (var g = 0; g < J; g++) E[Y + g] = O[f + g];

          Y += J;
          f += J;
        }

        if (f >= O.length) {
          alert('Some frames are damaged.');
          T.pop();
          break;
        }

        B();
        V.d = new Uint8Array(S);
        var r = a(E, 0, Y, V.d, 0, Q);
      } else if (Q == 59) break;else throw Q;
    }

    return {
      width: F,
      height: c,
      data: O,
      frames: T
    };
  };

  function D(j, F, O, c, b, H, k, Z) {
    for (var P = 0; P < k; P++) {
      var X = b[H + P];

      if (X != Z) {
        var l = F + P << 2,
            m = c + X * 3;
        j[l] = O[m];
        j[l + 1] = O[m + 1];
        j[l + 2] = O[m + 2];
        j[l + 3] = 255;
      }
    }
  }

  var w = function (j) {
    var F = j.frames,
        c = j.width,
        b = j.height,
        H = new Uint8Array(c * b * 4),
        k,
        Z = [],
        O = j.data;

    for (var P = 0; P < F.length; P++) {
      var X = F[P],
          l = X.x,
          m = X.y,
          e = X.a,
          T = X.O,
          V = X.f;

      if (V == 3) {
        if (k == null) k = H.slice(0);else k.set(H);
      }

      var W = [];

      if (X.U == 1) {
        for (var G = 0; G < T; G += 8) W.push(G);

        for (var G = 4; G < T; G += 8) W.push(G);

        for (var G = 2; G < T; G += 4) W.push(G);

        for (var G = 1; G < T; G += 2) W.push(G);
      }

      var C = X.d,
          z = X.A,
          Q = X.B,
          L = X.U;

      for (var G = 0; G < T; G++) {
        var s = L == 0 ? G : W[G];
        D(H, (s + m) * c + l, O, z, C, G * e, e, Q);
      }

      Z.push(H.slice(0).buffer);

      if (V < 2) {} else if (V == 2) {
        for (var G = 0; G < T; G++) {
          var R = ((m + G) * c + l) * 4;
          H.fill(0, R, R + e * 4);
        }
      } else if (V == 3) H.set(k);
    }

    return Z;
  };

  return {
    decode: d,
    toRGBA8: w
  };
}();

var _default = UGIF;
exports.default = _default;