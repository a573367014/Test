var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class Layout {
  constructor() {
    __publicField(this, "lifecycle", null);
    __publicField(this, "container", null);
    __publicField(this, "adapterTasks", []);
  }
  async setSlot(name, adapter) {
    this.adapterTasks.unshift([name, adapter]);
  }
  async setLifecycle(lifecycle) {
    let _lifecycle = typeof lifecycle === "function" ? lifecycle() : lifecycle;
    this.lifecycle = {
      ..._lifecycle,
      bootstrap: async (props) => {
        var _a;
        this.container = props.container;
        return (_a = _lifecycle == null ? void 0 : _lifecycle.bootstrap) == null ? void 0 : _a.call(_lifecycle, props);
      },
      mount: async (props) => {
        var _a;
        const ret = await ((_a = _lifecycle == null ? void 0 : _lifecycle.mount) == null ? void 0 : _a.call(_lifecycle, props));
        await this.runAdapterTasks();
        return ret;
      }
    };
  }
  getLifeCycle() {
    return this.lifecycle;
  }
  async runAdapterTasks() {
    var _a;
    for (const task of this.adapterTasks) {
      if (task) {
        const [name, adapter] = task;
        const slot = (_a = this.container) == null ? void 0 : _a.querySelector(`[slot="${name}"]`);
        if (!slot) {
          console.warn(`@growing-web/layout: No element found with slot='${name}'.`);
          return;
        }
        const application = await adapter();
        const widget = document.createElement("web-widget");
        widget.rendertarget = "light";
        widget.application = () => application;
        slot.appendChild(widget);
      }
    }
  }
}
const StylesProviderCache = window.StylesProviderCache || {
  contents: /* @__PURE__ */ new Map(),
  dependencies: /* @__PURE__ */ new Map(),
  providers: /* @__PURE__ */ new Map()
};
const create = (filter, container, name) => () => Array.from(StylesProviderCache.contents.keys()).filter((id) => filter.test(id)).forEach((id) => {
  useStyle(id)(container)[name]();
});
function getStyle(id) {
  return StylesProviderCache.contents.get(id);
}
function useQueryStyle(query) {
  const filter = new RegExp(`^(${query.replace(/\*+/g, ".*").split(",").join("|")})$`);
  return (container) => ({
    mount: create(filter, container, "mount"),
    unmount: create(filter, container, "unmount"),
    unload: create(filter, container, "unload")
  });
}
function useStyle(id) {
  if (StylesProviderCache.providers.has(id)) {
    return StylesProviderCache.providers.get(id);
  }
  StylesProviderCache.providers.set(id, function styleProvider(container = document.head) {
    var _a;
    let style;
    const provider = {
      mount: () => {
        if (container) {
          style = document.createElement("style");
          style.dataset.id = id;
          container.appendChild(style);
          provider.update();
        }
      },
      update: () => {
        if (style) {
          const content = getStyle(id);
          if (typeof content !== "string") {
            throw new Error(`Style not found: ${id}`);
          }
          style.innerHTML = content;
        }
      },
      unmount: () => {
        if (container && style) {
          container.removeChild(style);
          style = null;
        }
      },
      unload: () => {
        container = null;
        style = null;
        StylesProviderCache.dependencies.get(id).delete(provider);
      }
    };
    (_a = StylesProviderCache.dependencies.get(id)) == null ? void 0 : _a.add(provider);
    return provider;
  });
  return StylesProviderCache.providers.get(id);
}
window.StylesProviderCache = StylesProviderCache;
var allStyleProvider = useQueryStyle("@gaoding-es/basic-layout/*");
function vue3Adapter(Vue, App, { vueOptions = {}, lifeCycle = {} } = {}) {
  let appWrap;
  let app;
  let allStyle;
  return {
    async bootstrap(props) {
      allStyle = allStyleProvider(props.container);
    },
    async mount(props) {
      appWrap = document.createElement("div");
      props.container.appendChild(appWrap);
      allStyle.mount();
      app = createApp(App);
      app.mount(appWrap);
    },
    async unmount(props) {
    }
  };
}
function createLayout() {
  const layout = new Layout();
  layout.setLifecycle({
    async mount({ container }) {
      container.innerHTML = `
      <style>
        nav {
          height: 64px;
          width: 100%;
          box-shadow: 0 1px 6px rgb(0 0 0 / 8%);
        }
        .wrapper {
          display: flex;
          height: calc(100vh - 64px);
        }
        .wrapper aside {
          width: 220px;
          background: #f6f7f9;
          height: 100%;
        }
        .wrapper main {
          flex: 1;
          background: #ffffff;
          height: 100%;
          overflow-y: auto;
        }
      </style>

      <nav slot="nav"></nav>
      <section class="wrapper">
        <aside slot="menu"></aside>
        <main slot="main"></main>
      </section>
        `;
    },
    async unmount({ container }) {
      container.innerHTML = "";
    }
  });
  return layout;
}
export { createLayout, vue3Adapter };
