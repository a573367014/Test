const t$1 = "mounted", e$1 = "load-error", i$1 = "bootstrap-error", n$1 = "mount-error";
var s$1 = Object.freeze({ __proto__: null, INITIAL: "initial", LOADING: "loading", LOADED: "loaded", BOOTSTRAPPING: "bootstrapping", BOOTSTRAPPED: "bootstrapped", MOUNTING: "mounting", MOUNTED: t$1, UPDATING: "updating", UNMOUNTING: "unmounting", UNLOADING: "unloading", LOAD_ERROR: e$1, BOOTSTRAP_ERROR: i$1, MOUNT_ERROR: n$1, UPDATE_ERROR: "update-error", UNMOUNT_ERROR: "unmount-error", UNLOAD_ERROR: "unload-error" });
const o$1 = { load: { creator: true, timeout: 12e3, status: ["initial", "loading", "loaded", e$1] }, bootstrap: { pre: "load", timeout: 4e3, status: ["loaded", "bootstrapping", "bootstrapped", i$1] }, mount: { pre: "bootstrap", timeout: 3e3, status: ["bootstrapped", "mounting", t$1, n$1] }, update: { verify: true, timeout: 3e3, status: [t$1, "updating", t$1, "update-error"] }, unmount: { timeout: 3e3, status: [t$1, "unmounting", "bootstrapped", "unmount-error"] }, unload: { pre: "unmount", timeout: 3e3, status: ["bootstrapped", "unloading", "initial", "unload-error"] } }, r$1 = Symbol("setState");
class ApplicationService {
  constructor(t2, e2, i2) {
    this.timeouts = i2, this.state = "initial", this.lifecycles = /* @__PURE__ */ Object.create(null), this.loader = t2.bind(this.lifecycles), this.getDependencies = () => (typeof e2 == "function" && (e2 = e2()), e2);
  }
  getState() {
    return this.state;
  }
  [r$1](t2) {
    t2 !== this.state && (this.state = t2, this.stateChangeCallback());
  }
  stateChangeCallback() {
  }
  async trigger(t2) {
    const e2 = this.timeouts[t2], i2 = typeof e2 == "number", n2 = o$1[t2], [s2, a2, c2, d2] = n2.status;
    if (!n2)
      throw new Error(`Cannot ${t2}`);
    if (this.pending && await this.pending, n2.creator && !this.lifecycles[t2] && (this.lifecycles[t2] = async (t3) => {
      let e3 = await this.loader(t3);
      typeof e3 == "function" && (e3 = e3(t3)), e3 || (e3 = {}), Object.assign(this.lifecycles, e3);
    }), s2 !== this.state && n2.pre && await this.trigger(n2.pre), [s2, d2].includes(this.state)) {
      if (this[r$1](a2), this.lifecycles[t2])
        return this.pending = function(t3, e3, i3, n3 = false, s3 = 1e3) {
          return new Promise((o2, r2) => {
            const a3 = `Lifecycle function did not complete within ${i3} ms: ${t3}`;
            let c3 = false, d3 = false;
            function l2(t4) {
              if (!c3) {
                if (t4 === true)
                  d3 = true, n3 ? r2(new Error(a3)) : console.error(new Error(a3));
                else if (!d3) {
                  const e4 = t4, n4 = e4 * s3;
                  console.warn(new Error(a3)), n4 + s3 < i3 && setTimeout(() => l2(e4 + 1), s3);
                }
              }
            }
            e3().then((t4) => {
              c3 = true, o2(t4);
            }).catch((t4) => {
              c3 = true, r2(t4);
            }), n3 || setTimeout(() => l2(1), s3), setTimeout(() => l2(true), i3);
          });
        }(t2, async () => this.lifecycles[t2](this.getDependencies()), i2 ? e2 : o$1[t2].timeout, i2, 1e3).then(() => {
          this[r$1](c2), delete this.pending;
        }).catch((t3) => {
          throw this[r$1](d2), delete this.pending, t3;
        }), this.pending;
      this[r$1](c2);
    } else if (n2.verify)
      throw new Error(`Cannot ${t2}: Application state: ${this.state}`);
  }
}
function a$1() {
  const t2 = /* @__PURE__ */ new Map();
  return { [Symbol("data")]: t2, get: (e2) => t2.get(e2), define(e2, i2) {
    t2.set(e2, i2);
  } };
}
const c$1 = HTMLScriptElement.supports && HTMLScriptElement.supports("importmap");
function d$1(t2) {
  return t2.default || t2;
}
function l$1(t2) {
  return c$1 || typeof importShim != "function" ? import(t2) : importShim(t2);
}
let u$1;
const h$1 = typeof window.queueMicrotask == "function" ? window.queueMicrotask.bind(window) : (t2) => (u$1 || (u$1 = Promise.resolve())).then(t2).catch((t3) => setTimeout(() => {
  throw t3;
}, 0)), b$1 = Symbol("context"), m$1 = Symbol("createPortal");
function p$1(t2) {
  return { mount: () => t2.mount(), update: (e2) => t2.update(e2), unmount: () => t2.unmount() };
}
class WebWidgetDependencies {
  constructor(t2) {
    Reflect.defineProperty(this, "ownerElement", { get: () => t2 });
  }
  get container() {
    const t2 = this.ownerElement;
    return t2.renderRoot = t2.renderRoot || t2.createRenderRoot(), t2.renderRoot;
  }
  get context() {
    return this[b$1] || (this[b$1] = p$1(this.ownerElement)), this[b$1];
  }
  get createPortal() {
    return this[m$1] || (this[m$1] = (t2, e2) => {
      const i2 = this.ownerElement, n2 = i2.constructor, s2 = n2.portalDestinations.get(e2), o2 = s2 ? s2() : null;
      if (!o2)
        throw new Error(`The portal cannot be found: ${e2}`);
      if (!(o2 instanceof n2))
        throw new Error(`Portal must be an instance of "HTMLWebWidgetElement": ${e2}`);
      this.sandboxed && !t2.isConnected && this.container.appendChild(t2), t2.slot || (t2.slot = "");
      const r2 = o2.querySelector(`[slot="${t2.slot}"]`);
      return r2 && o2.removeChild(r2), o2.appendChild(t2), o2.mount(), i2.portals.push(o2), p$1(o2);
    }), this[m$1];
  }
  get data() {
    const t2 = this.ownerElement.data;
    return Array.isArray(t2) ? [...t2] : { ...t2 };
  }
  set data(t2) {
    this.ownerElement.data = t2;
  }
  get name() {
    return this.ownerElement.name;
  }
  get parameters() {
    return [...this.ownerElement.attributes].reduce((t2, { name: e2, value: i2 }) => (t2[e2] = i2, t2), {});
  }
  get sandboxed() {
    const { sandboxed: t2 } = this.ownerElement;
    return t2;
  }
}
window.WebWidgetDependencies = WebWidgetDependencies;
class WebWidgetSandbox {
  constructor(t2) {
    Reflect.defineProperty(this, "ownerElement", { get: () => t2 });
  }
  unload() {
  }
  get window() {
    return null;
  }
}
window.WebWidgetSandbox = WebWidgetSandbox;
const g$1 = Symbol("application"), f$1 = Symbol("data"), w$1 = Symbol("firstConnect"), y$1 = Symbol("applicationService"), E$1 = Symbol("moveing"), A$1 = Symbol("parentWidget"), S$1 = Symbol("statechangeCallback"), R = Symbol("throwGlobalError"), x$1 = Symbol("timeouts"), T = Symbol("trigger"), W = Symbol("tryAutoLoad"), O = Symbol("tryAutoLoadTimer"), v$1 = Symbol("tryAutoUnload"), L$1 = Symbol("tryAutoUnloadTimer"), C = a$1(), N = a$1();
let D = /* @__PURE__ */ Object.create(null);
const M = (t2) => !t2.inactive, U = (t2) => t2.isConnected && (t2.import || t2.src || t2.application || t2.text), P$1 = (t2) => M(t2) && U(t2), k$1 = M, j = new IntersectionObserver((t2) => {
  t2.forEach(({ isIntersecting: t3, target: e2 }) => {
    t3 && P$1(e2) && (e2[W](), j.unobserve(e2));
  });
}, { rootMargin: "80%" });
function I(t2) {
  !function(t3, e2) {
    const i2 = "web-widget";
    e2([...t3.querySelectorAll(`[is=${i2}]`)].filter((t4) => t4.localName.includes("-"))), new MutationObserver((t4) => {
      e2(t4.reduce((t5, { type: e3, target: i3, addedNodes: n2 }) => (e3 === "attributes" ? t5.push(i3) : t5.push(...n2), t5), []).filter((t5) => t5.nodeType === Node.ELEMENT_NODE && t5.localName.includes("-") && t5.getAttribute("is") === i2));
    }).observe(t3, { attributeFilter: ["is"], attributes: true, childList: true, subtree: true });
  }(t2, (t3) => {
    t3.forEach((t4) => {
      const e2 = t4.localName;
      if (!customElements.get(e2)) {
        customElements["define"](e2, class extends HTMLWebWidgetElement {
        });
      }
    });
  });
}
class HTMLWebWidgetElement extends HTMLElement {
  constructor() {
    super();
    const t2 = this, e2 = new ApplicationService(function(e3) {
      if (!U(t2))
        throw new Error("Cannot load: Not initialized");
      const { application: i2 } = t2;
      if (t2.sandbox = t2.sandbox || t2.sandboxed ? t2.createSandbox() : null, t2.renderRoot = null, t2.loader = i2 || t2.createLoader(), t2.portals = [], t2.sandboxed && !t2.sandbox.window)
        throw new Error("Sandbox mode is not implemented");
      return t2.loader.call(this, e3);
    }, () => {
      const t3 = this.createDependencies();
      return this.dependencies = t3, t3;
    }, this.timeouts);
    e2.stateChangeCallback = () => {
      this[S$1](), this.dispatchEvent(new Event("statechange"));
    }, this[y$1] = e2;
  }
  get application() {
    return this[g$1] || null;
  }
  set application(t2) {
    typeof t2 == "function" && (this[g$1] = t2, this[W]());
  }
  get csp() {
    return this.getAttribute("csp") || "";
  }
  set csp(t2) {
    this.setAttribute("csp", t2);
  }
  get data() {
    if (!this[f$1]) {
      const t2 = this.getAttribute("data");
      if (t2)
        try {
          this[f$1] = JSON.parse(t2);
        } catch (t3) {
          this[R](t3), this[f$1] = {};
        }
      else
        this[f$1] = { ...this.dataset };
    }
    return this[f$1];
  }
  set data(t2) {
    typeof t2 == "object" && (this[f$1] = t2);
  }
  get inactive() {
    return this.hasAttribute("inactive");
  }
  set inactive(t2) {
    t2 ? this.setAttribute("inactive", "") : this.removeAttribute("inactive");
  }
  get loading() {
    return this.getAttribute("loading") || "auto";
  }
  set loading(t2) {
    this.setAttribute("loading", t2);
  }
  get type() {
    return this.getAttribute("type") || "module";
  }
  set type(t2) {
    this.setAttribute("type", t2);
  }
  get state() {
    return this[y$1].getState();
  }
  get sandboxed() {
    return this.hasAttribute("sandboxed");
  }
  set sandboxed(t2) {
    t2 ? this.setAttribute("sandboxed", "") : this.removeAttribute("sandboxed");
  }
  get name() {
    return this.getAttribute("name") || "";
  }
  set name(t2) {
    this.setAttribute("name", t2);
  }
  get src() {
    const t2 = this.getAttribute("src");
    return t2 === null ? "" : new URL(t2, this.baseURI).href;
  }
  set src(t2) {
    this.setAttribute("src", t2);
  }
  get import() {
    const t2 = this.getAttribute("import");
    return t2 === null ? "" : t2;
  }
  set import(t2) {
    this.setAttribute("import", t2);
  }
  get rendertarget() {
    return this.getAttribute("rendertarget") || "shadow";
  }
  set rendertarget(t2) {
    this.setAttribute("rendertarget", t2);
  }
  get text() {
    return this.getAttribute("text") || "";
  }
  set text(t2) {
    this.setAttribute("text", t2);
  }
  get timeouts() {
    return this[x$1] || (this[x$1] = { ...this.constructor.timeouts }), this[x$1];
  }
  set timeouts(t2) {
    this[x$1] = t2;
  }
  createDependencies() {
    return new WebWidgetDependencies(this);
  }
  createSandbox() {
    return new WebWidgetSandbox(this);
  }
  createRenderRoot() {
    let t2 = null;
    const { sandboxed: e2, sandbox: i2 } = this;
    if (e2) {
      const e3 = i2.window.document, n2 = e3.createElement("style");
      n2.textContent = "body{margin:0}", e3.head.appendChild(n2), t2 = e3.body;
    } else
      this.rendertarget === "shadow" ? (t2 = this.attachShadow({ mode: "closed" }), I(t2)) : this.rendertarget === "light" && (t2 = this);
    return t2;
  }
  createLoader() {
    const { type: t2 } = this, e2 = this.constructor.loaders.get(t2);
    if (!e2)
      throw Error(`Loader is not defined: ${t2}`);
    return () => e2(this);
  }
  async load() {
    await this[T]("load");
  }
  async bootstrap() {
    await this[T]("bootstrap");
  }
  async mount() {
    await this[T]("mount");
  }
  async update(t2 = {}) {
    const e2 = this.dependencies || {};
    Object.assign(e2, t2), await this[T]("update");
  }
  async unmount() {
    const t2 = this.portals || [];
    await this[T]("unmount"), await Promise.all(t2.map((t3) => t3.unmount()));
  }
  async unload() {
    const t2 = this.portals || [], e2 = this.dependencies || {};
    await this[T]("unload"), await Promise.all(t2.map((t3) => t3.unload())), Object.getOwnPropertyNames(e2).forEach((t3) => {
      Reflect.deleteProperty(e2, t3);
    });
  }
  connectedCallback() {
    this[w$1] ? this[E$1] && this.movedCallback() : (this.firstConnectedCallback(), this[w$1] = true);
  }
  firstConnectedCallback() {
    if (this[A$1]()) {
      const { sandboxed: t3, csp: e2 } = this[A$1]();
      t3 && (this.sandboxed = t3), e2 && (this.csp = e2);
    }
    var t2;
    this.loading === "lazy" ? (t2 = this, j.observe(t2)) : this[W]();
  }
  disconnectedCallback() {
    this[E$1] = true, h$1(() => {
      this.isConnected || (this[E$1] = false, this.destroyedCallback());
    });
  }
  attributeChangedCallback(t2) {
    t2 === "data" ? delete this[f$1] : this.loading !== "lazy" && this[W]();
  }
  destroyedCallback() {
    var t2;
    this.loading === "lazy" && (t2 = this, j.unobserve(t2)), this[v$1]();
  }
  [W]() {
    this[O] = setTimeout(() => {
      P$1(this) && this.mount().catch(this[R].bind(this)), clearTimeout(this[O]);
    });
  }
  [v$1]() {
    this[L$1] = setTimeout(() => {
      k$1(this) && (this.unload().catch(this[R].bind(this)), this.sandboxed && this.sandbox.unload()), clearTimeout(this[L$1]);
    });
  }
  [T](t2) {
    return this[y$1].trigger(t2, [this.dependencies]);
  }
  [S$1]() {
    const s2 = this.state;
    if ([t$1, e$1, i$1, n$1].includes(s2)) {
      let e2, i2;
      const n2 = s2 !== t$1;
      for (const t2 of this.children) {
        const n3 = t2.localName;
        n3 === "placeholder" ? e2 = t2 : n3 === "fallback" && (i2 = t2);
      }
      e2 && i2 ? (e2.hidden = n2, i2.hidden = !n2) : e2 ? n2 || (e2.hidden = true) : i2 && (i2.hidden = !n2);
    }
  }
  [A$1]() {
    const t2 = function(t3, e2) {
      let i2 = t3;
      do {
        if (i2 = i2.getRootNode().host, i2 && i2 instanceof e2)
          return i2;
      } while (i2);
      return null;
    }(this, this.constructor);
    return t2 || null;
  }
  [R](t2) {
    const e2 = `Web Widget application (${this.name || this.import || this.src || this.localName})`;
    typeof t2 != "object" && (t2 = new Error(t2)), t2.message.includes(e2) || Reflect.defineProperty(t2, "message", { value: `${e2}: ${t2.message}`, writable: true, configurable: true }), h$1(() => {
      throw t2;
    });
  }
  static get observedAttributes() {
    return ["data", "import", "src", "text", "inactive"];
  }
  static get portalDestinations() {
    return C;
  }
  static get loaders() {
    return N;
  }
  static get timeouts() {
    return D;
  }
  static set timeouts(t2) {
    D = t2;
  }
}
function $$1() {
  customElements.define("web-widget", HTMLWebWidgetElement), I(document);
}
Object.assign(HTMLWebWidgetElement, s$1), N.define("module", async function(t2) {
  const { src: e2, text: i2, sandboxed: n2 } = t2, s2 = t2.import || e2;
  if (n2)
    throw new Error("The sandbox does not support ES module");
  if (s2)
    return l$1(s2).then(d$1);
  const o2 = new Blob([i2], { type: "application/javascript" }), r2 = URL.createObjectURL(o2);
  return l$1(r2).then((t3) => (URL.revokeObjectURL(r2), d$1(t3)), (t3) => {
    throw URL.revokeObjectURL(r2), t3;
  });
}), window.HTMLWebWidgetElement = HTMLWebWidgetElement, window.WEB_WIDGET_BOOTSTRAP !== false && $$1();
class HTMLWebRouteElement extends HTMLElement {
  get element() {
    return this.getAttribute("element");
  }
  set element(t2) {
    this.setAttribute("element", t2);
  }
  get path() {
    return this.getAttribute("path");
  }
  set path(t2) {
    this.setAttribute("path", t2);
  }
  get index() {
    return this.hasAttribute("index");
  }
  set index(t2) {
    t2 ? this.setAttribute("index", "") : this.removeAttribute("index");
  }
  get title() {
    return this.getAttribute("title");
  }
  set title(t2) {
    this.setAttribute("title", t2);
  }
}
function t() {
  return t = Object.assign || function(t2) {
    for (var e2 = 1; e2 < arguments.length; e2++) {
      var n2 = arguments[e2];
      for (var a2 in n2)
        Object.prototype.hasOwnProperty.call(n2, a2) && (t2[a2] = n2[a2]);
    }
    return t2;
  }, t.apply(this, arguments);
}
customElements.define("web-route", HTMLWebRouteElement);
var e, n = e || (e = {});
n.Pop = "POP", n.Push = "PUSH", n.Replace = "REPLACE";
var a = function(t2) {
  return Object.freeze(t2);
};
function r(t2) {
  t2.preventDefault(), t2.returnValue = "";
}
function i() {
  var t2 = [];
  return { get length() {
    return t2.length;
  }, push: function(e2) {
    return t2.push(e2), function() {
      t2 = t2.filter(function(t3) {
        return t3 !== e2;
      });
    };
  }, call: function(e2) {
    t2.forEach(function(t3) {
      return t3 && t3(e2);
    });
  } };
}
function o(t2) {
  var e2 = {};
  if (t2) {
    var n2 = t2.indexOf("#");
    0 <= n2 && (e2.hash = t2.substr(n2), t2 = t2.substr(0, n2)), 0 <= (n2 = t2.indexOf("?")) && (e2.search = t2.substr(n2), t2 = t2.substr(0, n2)), t2 && (e2.pathname = t2);
  }
  return e2;
}
const s = function(n2) {
  function s2() {
    var t2 = p2.location, e2 = d2.state || {};
    return [e2.idx, a({ pathname: t2.pathname, search: t2.search, hash: t2.hash, state: e2.usr || null, key: e2.key || "default" })];
  }
  function l2(t2) {
    return typeof t2 == "string" ? t2 : function(t3) {
      var e2 = t3.pathname;
      e2 = e2 === void 0 ? "/" : e2;
      var n3 = t3.search;
      return n3 = n3 === void 0 ? "" : n3, t3 = (t3 = t3.hash) === void 0 ? "" : t3, n3 && n3 !== "?" && (e2 += n3.charAt(0) === "?" ? n3 : "?" + n3), t3 && t3 !== "#" && (e2 += t3.charAt(0) === "#" ? t3 : "#" + t3), e2;
    }(t2);
  }
  function h2(e2, n3) {
    return n3 === void 0 && (n3 = null), a(t({ pathname: v2.pathname, hash: "", search: "" }, typeof e2 == "string" ? o(e2) : e2, { state: n3, key: Math.random().toString(36).substr(2, 8) }));
  }
  function c2(t2) {
    f2 = t2, t2 = s2(), b2 = t2[0], v2 = t2[1], g2.call({ action: f2, location: v2 });
  }
  function u2(t2) {
    d2.go(t2);
  }
  n2 === void 0 && (n2 = {});
  var p2 = (n2 = n2.window) === void 0 ? document.defaultView : n2, d2 = p2.history, m2 = null;
  p2.addEventListener("popstate", function() {
    if (m2)
      w2.call(m2), m2 = null;
    else {
      var t2 = e.Pop, n3 = s2(), a2 = n3[0];
      if (n3 = n3[1], w2.length)
        if (a2 != null) {
          var r2 = b2 - a2;
          r2 && (m2 = { action: t2, location: n3, retry: function() {
            u2(-1 * r2);
          } }, u2(r2));
        } else
          !function(t3, e2) {
            if (!t3) {
              typeof console != "undefined" && console.warn(e2);
              try {
                throw Error(e2);
              } catch (t4) {
              }
            }
          }(false, "You are trying to block a POP navigation to a location that was not created by the history library. The block will fail silently in production, but in general you should do all navigation with the history library (instead of using window.history.pushState directly) to avoid this situation.");
      else
        c2(t2);
    }
  });
  var f2 = e.Pop, b2 = (n2 = s2())[0], v2 = n2[1], g2 = i(), w2 = i();
  return b2 == null && (b2 = 0, d2.replaceState(t({}, d2.state, { idx: b2 }), "")), { get action() {
    return f2;
  }, get location() {
    return v2;
  }, createHref: l2, push: function t2(n3, a2) {
    var r2 = e.Push, i2 = h2(n3, a2);
    if (!w2.length || (w2.call({ action: r2, location: i2, retry: function() {
      t2(n3, a2);
    } }), 0)) {
      var o2 = [{ usr: i2.state, key: i2.key, idx: b2 + 1 }, l2(i2)];
      i2 = o2[0], o2 = o2[1];
      try {
        d2.pushState(i2, "", o2);
      } catch (t3) {
        p2.location.assign(o2);
      }
      c2(r2);
    }
  }, replace: function t2(n3, a2) {
    var r2 = e.Replace, i2 = h2(n3, a2);
    w2.length && (w2.call({ action: r2, location: i2, retry: function() {
      t2(n3, a2);
    } }), 1) || (i2 = [{ usr: i2.state, key: i2.key, idx: b2 }, l2(i2)], d2.replaceState(i2[0], "", i2[1]), c2(r2));
  }, go: u2, back: function() {
    u2(-1);
  }, forward: function() {
    u2(1);
  }, listen: function(t2) {
    return g2.push(t2);
  }, block: function(t2) {
    var e2 = w2.push(t2);
    return w2.length === 1 && p2.addEventListener("beforeunload", r), function() {
      e2(), w2.length || p2.removeEventListener("beforeunload", r);
    };
  } };
}();
function l(t2, e2) {
  if (!t2)
    throw new Error(e2);
}
function h(t2, e2) {
  if (!t2) {
    typeof console != "undefined" && console.warn(e2);
    try {
      throw new Error(e2);
    } catch (t3) {
    }
  }
}
function c(t2, e2) {
  typeof t2 == "string" && (t2 = { path: t2, caseSensitive: false, end: true });
  const [n2, a2] = function(t3, e3 = false, n3 = true) {
    h(t3 === "*" || !t3.endsWith("*") || t3.endsWith("/*"), `Route path "${t3}" will be treated as if it were "${t3.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${t3.replace(/\*$/, "/*")}".`);
    const a3 = [];
    let r3 = `^${t3.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^$?{}|()[\]]/g, "\\$&").replace(/:(\w+)/g, (t4, e4) => (a3.push(e4), "([^\\/]+)"))}`;
    return t3.endsWith("*") ? (a3.push("*"), r3 += t3 === "*" || t3 === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$") : r3 += n3 ? "\\/*$" : "(?:\\b|\\/|$)", [new RegExp(r3, e3 ? void 0 : "i"), a3];
  }(t2.path, t2.caseSensitive, t2.end), r2 = e2.match(n2);
  if (!r2)
    return null;
  const i2 = r2[0];
  let o2 = i2.replace(/(.)\/+$/, "$1");
  const s2 = r2.slice(1);
  return { params: a2.reduce((t3, e3, n3) => {
    if (e3 === "*") {
      const t4 = s2[n3] || "";
      o2 = i2.slice(0, i2.length - t4.length).replace(/(.)\/+$/, "$1");
    }
    return t3[e3] = function(t4, e4) {
      try {
        return decodeURIComponent(t4);
      } catch (n4) {
        return h(false, `The value for the URL param "${e4}" will not be decoded because the string "${t4}" is a malformed URL segment. This is probably due to a bad percent encoding (${n4}).`), t4;
      }
    }(s2[n3] || "", e3), t3;
  }, {}), pathname: i2, pathnameBase: o2, pattern: t2 };
}
const u = (t2) => t2.join("/").replace(/\/\/+/g, "/");
function p(t2, e2 = [], n2 = [], a2 = "") {
  return t2.forEach((t3, r2) => {
    const i2 = { relativePath: t3.path || "", caseSensitive: t3.caseSensitive === true, childrenIndex: r2, route: t3 };
    i2.relativePath.startsWith("/") && (l(i2.relativePath.startsWith(a2), `Absolute route path "${i2.relativePath}" nested under path "${a2}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`), i2.relativePath = i2.relativePath.slice(a2.length));
    const o2 = u([a2, i2.relativePath]), s2 = n2.concat(i2);
    t3.children && t3.children.length > 0 && (l(t3.index !== true, `Index routes must not have child routes. Please remove all child routes from route path "${o2}".`), p(t3.children, e2, s2, o2)), (t3.path != null || t3.index) && e2.push({ path: o2, routesMeta: s2 });
  }), e2;
}
function d(t2, e2) {
  const { routesMeta: n2 } = t2, a2 = {};
  let r2 = "/";
  const i2 = [];
  for (let t3 = 0; t3 < n2.length; ++t3) {
    const o2 = n2[t3], s2 = t3 === n2.length - 1, l2 = r2 === "/" ? e2 : e2.slice(r2.length) || "/", h2 = c({ path: o2.relativePath, caseSensitive: o2.caseSensitive, end: s2 }, l2);
    if (!h2)
      return null;
    Object.assign(a2, h2.params);
    const p2 = o2.route;
    i2.push({ params: a2, pathname: u([r2, h2.pathname]), pathnameBase: u([r2, h2.pathnameBase]), route: p2 }), h2.pathnameBase !== "/" && (r2 = u([r2, h2.pathnameBase]));
  }
  return i2;
}
function m(t2, e2, n2 = "/") {
  const a2 = function(t3, e3) {
    if (e3 === "/")
      return t3;
    if (!t3.toLowerCase().startsWith(e3.toLowerCase()))
      return null;
    const n3 = t3.charAt(e3.length);
    return n3 && n3 !== "/" ? null : t3.slice(e3.length) || "/";
  }((typeof e2 == "string" ? o(e2) : e2).pathname || "/", n2);
  if (a2 == null)
    return null;
  const r2 = p(t2);
  let i2 = null;
  for (let t3 = 0; i2 == null && t3 < r2.length; ++t3)
    i2 = d(r2[t3], a2);
  return i2;
}
const f = Symbol("old-pathname"), b = Symbol("new-pathname"), v = Symbol("state");
class NavigationChangeEvent extends Event {
  constructor(t2, e2 = {}) {
    super(t2, e2), this[b] = e2.newPathname, this[f] = e2.oldPathname, this[v] = e2.state;
  }
  get newPathname() {
    return this[b];
  }
  get oldPathname() {
    return this[f];
  }
  get state() {
    return this[v];
  }
}
const g = Symbol("change"), w = Symbol("routes"), y = Symbol("render"), E = Symbol("location"), A = Symbol("un-history-listen");
function P(t2, e2) {
  return window.dispatchEvent(new NavigationChangeEvent(t2, e2));
}
class HTMLWebRouterElement extends HTMLElement {
  get outlet() {
    return this;
  }
  get routes() {
    if (this[w])
      return this[w];
    const t2 = (e2) => {
      const n2 = [], a2 = ["path", "element", "index", "title"];
      for (const r2 of e2.children)
        r2.localName === "web-route" && n2.push({ path: r2.path, title: r2.title, element: r2.element, index: r2.index, children: t2(r2), attributes: [...r2.attributes].reduce((t3, { name: e3, value: n3 }) => (a2.includes(e3) || (t3[e3] = n3), t3), {}) });
      return n2;
    };
    return this[w] = t2(this), this[w];
  }
  connectedCallback() {
    const t2 = (t3 = { location: s.location, action: s.action }) => this[g](t3);
    this[A] = s.listen(t2), t2();
  }
  disconnectedCallback() {
    this[A]();
  }
  createElement(t2) {
    return t2 == null ? null : t2.reduceRight((t3, e2) => {
      let n2;
      if (e2.route.element) {
        n2 = document.createElement(e2.route.element, { is: e2.route.attributes.is });
        const t4 = ["routepattern", e2.pathname], a2 = Object.entries(e2.params).filter(([t5]) => t5 !== "*").map(([t5, e3]) => [`routeparam-${t5}`, e3]);
        [...Object.entries(e2.route.attributes), t4, ...a2].forEach(([t5, e3]) => {
          n2.setAttribute(t5, e3);
        }), n2.router = { history: s, location: s.location }, n2.route = { path: e2.route.path, params: e2.params };
      } else
        n2 = document.createDocumentFragment();
      return t3 && n2.appendChild(t3), n2;
    }, null);
  }
  matchRoutes(t2) {
    return m(this.routes, t2);
  }
  async [g]({ location: t2 }) {
    var _a;
    if (!this[E] || this[E].pathname !== t2.pathname) {
      const e2 = this.matchRoutes(t2.pathname);
      if (e2) {
        const n2 = (_a = this[E]) == null ? void 0 : _a.pathname, a2 = { oldPathname: n2, newPathname: t2.pathname, state: t2.state };
        this[E] = t2, P("navigationstart", a2);
        try {
          await this.renderMatches(e2);
        } catch (t3) {
          throw P("navigationerror", a2), t3;
        }
        P("navigationend", a2);
      }
    }
  }
  async renderMatches(t2) {
    this[y] && this[y].trash();
    const e2 = t2.map(({ path: t3 }) => t3), n2 = [...this.outlet.querySelectorAll("[routepattern]")].filter((t3) => t3.localName !== "web-route" && !e2.includes(t3.getAttribute("routepattern"))), a2 = this.createElement(t2), r2 = (t3) => t3.load && t3.bootstrap && t3.mount && t3.unload, i2 = [a2, ...a2.querySelectorAll("*")].filter(r2), o2 = (t3, e3, n3) => function(t4) {
      let e4 = () => {
      };
      const n4 = new Promise((n5, a3) => {
        e4 = () => {
          n5 = null, a3 = null;
        }, t4.then((t5) => {
          n5 && n5(t5);
        }, (t5) => {
          a3 && a3(t5);
        });
      });
      return n4.trash = e4, n4;
    }(e3 ? function(t4, e4, n4) {
      return new Promise((a3, r3) => {
        t4.then(() => a3(t4), (t5) => r3(t5)), setTimeout(() => n4 ? a3() : r3(new Error("Timeout")), e4);
      });
    }(Promise.all(t3), e3, n3) : Promise.all(t3));
    i2.forEach((t3) => {
      t3.hidden = true, t3.setAttribute("inactive", "");
    }), this.outlet.appendChild(a2), await (this[y] = o2(i2.map((t3) => t3.load()))), document.title = t2.map(({ route: t3 }) => t3.title).filter((t3) => typeof t3 == "string").pop() || document.title, await (this[y] = o2(i2.map((t3) => t3.bootstrap()))), await (this[y] = o2(n2.filter(r2).map((t3) => t3.unload()), 1e3, true)), n2.forEach((t3) => {
      t3.parentNode && t3.parentNode.removeChild(t3);
    }), await (this[y] = o2(i2.map((t3) => t3.mount()))), i2.forEach((t3) => {
      t3.hidden = false, t3.removeAttribute("inactive");
    }), delete this[y];
  }
}
customElements.define("web-router", HTMLWebRouterElement);
let L = s.location.pathname;
class WebRouter {
  static navigate(t2, { replace: e2, state: n2 = {} } = {}) {
    (function(t3, { state: e3 } = {}) {
      const n3 = { cancelable: true, oldPathname: L, newPathname: t3, state: e3 };
      return L = t3, window.dispatchEvent(new NavigationChangeEvent("navigationwillchange", n3));
    })(t2, { state: n2 }) && (e2 ? s.replace(t2, n2) : s.push(t2, n2));
  }
}
window.WebRouter = WebRouter;
const S = Symbol("state"), x = Symbol("handle-click"), $ = Symbol("handle-navigation"), k = Symbol("same-origin");
class HTMLWebLinkElement extends HTMLAnchorElement {
  constructor() {
    super(), this[$] = this[$].bind(this), this[x] = this[x].bind(this);
  }
  get state() {
    if (!this[S]) {
      const t2 = this.getAttribute("state");
      if (t2)
        try {
          this[S] = JSON.parse(t2);
        } catch (t3) {
          this[S] = {};
        }
    }
    return this[S];
  }
  set state(t2) {
    typeof t2 == "object" && (this[S] = t2);
  }
  get replace() {
    return this.hasAttribute("replace");
  }
  set replace(t2) {
    t2 ? this.setAttribute("replace", "") : this.removeAttribute("replace");
  }
  get end() {
    return this.hasAttribute("end");
  }
  set end(t2) {
    t2 ? this.setAttribute("end", "") : this.removeAttribute("end");
  }
  get active() {
    if (!this[k]())
      return false;
    let t2 = s.location.pathname, e2 = this.pathname;
    this.caseSensitive || (t2 = t2.toLowerCase(), e2 = e2.toLowerCase());
    return t2 === e2 || !this.end && t2.startsWith(e2) && t2.charAt(e2.length) === "/";
  }
  static get observedAttributes() {
    return ["state"];
  }
  connectedCallback() {
    this.addEventListener("click", this[x]), window.addEventListener("navigationstart", this[$]), this[$]();
  }
  disconnectedCallback() {
    this.removeEventListener("click", this[x]), window.removeEventListener("navigationstart", this[$]);
  }
  attributeChangedCallback(t2) {
    t2 === "state" && delete this[S];
  }
  [x](t2) {
    const e2 = this.pathname;
    this[k]() && [...document.querySelectorAll("web-router")].some((t3) => !!t3.matchRoutes(this.pathname)) && (WebRouter.navigate(e2, { replace: this.replace, state: this.state }), t2.preventDefault());
  }
  [$]() {
    this.active ? this.setAttribute("active", "") : this.removeAttribute("active");
  }
  [k]() {
    return this.protocol === location.protocol && this.host === location.host && this.port === location.port;
  }
}
customElements.define("web-link", HTMLWebLinkElement, { extends: "a" });
function defineHook(target, name, callback) {
  return Reflect.defineProperty(target, name, callback(Reflect.getOwnPropertyDescriptor(target, name)));
}
function isRouterApp(widget) {
  return [...document.querySelectorAll("web-router")].some((router) => router.contains(widget));
}
function getRootAppData() {
  const element = document.querySelector('script[type="application/sd+json"]');
  if (element) {
    try {
      return JSON.parse(element.textContent);
    } catch (error) {
    }
  }
  return null;
}
defineHook(WebWidgetDependencies.prototype, "data", ({ get }) => {
  return {
    get() {
      const data = get.apply(this, arguments);
      if (isRouterApp(this.ownerElement)) {
        const rootAppData = getRootAppData();
        return { ...rootAppData, ...data };
      }
      return data;
    }
  };
});
