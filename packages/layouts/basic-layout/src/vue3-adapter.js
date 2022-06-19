import allStyleProvider from 'virtual:style-provider?query=~/*'

export function vue3Adapter(
  Vue,
  App,
  { vueOptions = {}, lifeCycle = {} } = {},
) {
  let appWrap
  let app
  let allStyle
  return {
    async bootstrap(props) {
      allStyle = allStyleProvider(props.container)
    },
    async mount(props) {
      appWrap = document.createElement('div')
      props.container.appendChild(appWrap)
      allStyle.mount()

      app = createApp(App)
      app.mount(appWrap)
    },
    async unmount(props) {},
  }
}
