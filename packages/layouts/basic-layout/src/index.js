import { Layout } from './layout'

export function createLayout() {
  const layout = new Layout()
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
        `
    },
    async unmount({ container }) {
      container.innerHTML = ''
    },
  })
  return layout
}

export { vue3Adapter } from './vue3-adapter'
