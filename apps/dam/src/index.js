import { createApp } from 'vue'
import App from './App.vue'
import { createLayout } from '@gaoding-es/basic-layout'
import Nav from '@gaoding-es/nav-widget'
import allStyleProvider from 'virtual:style-provider?query=~/*'

const layout = createLayout()

let appWrap
let app
let allStyle

console.log(layout)
layout.setSlot('main', () => ({
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
}))
layout.setSlot('nav', () => Nav)

export default layout.getLifeCycle()
