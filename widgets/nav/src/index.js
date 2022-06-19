export default function () {
  return {
    async mount({ container }) {
      container.innerHTML = `
      <nav>
        <a is="web-link" href="/cdm">cdm</a> |
        <a is="web-link" href="/dam">dam</a> |
        <a is="web-link" href="/enterprise">enterprise</a>
      </nav>`
    },

    async unmount({ container }) {
      // container.innerHTML = ''
    },
  }
}
