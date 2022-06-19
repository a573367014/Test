import allStyleProvider from "virtual:style-provider?query=~/*";
function vue2Adapter(Vue, App, { vueOptions = {}, lifeCycle = {} } = {}) {
  let appWrap;
  let allStyle;
  return {
    async bootstrap(props) {
      allStyle = allStyleProvider(props.container);
    },
    async mount(props) {
      appWrap = document.createElement("div");
      props.container.appendChild(appWrap);
      allStyle.mount();
      new Vue({
        ...vueOptions,
        el: appWrap,
        render: (h) => h(App)
      });
    },
    async unmount(props) {
    }
  };
}
export { vue2Adapter };
