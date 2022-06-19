import './v-loading.less';

function createLoadingElement() {
    const loadingEl = document.createElement('div');
    loadingEl.classList.add('eui-v2-loading-directive');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '1em');
    svg.setAttribute('height', '1em');
    svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.innerHTML = '<use xlink:href="#eui-v2-icon--loader"></use>';
    svg.classList.add('eui-v2-icon');
    loadingEl.appendChild(svg);

    loadingEl.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
    };
    return loadingEl;
}

export default function(el, binding) {
    const loading = binding.value;
    if(loading) {
        const styles = getComputedStyle(el, null);
        el.__position = styles.position;
        if(['fixed', 'absolute', 'relative'].indexOf(styles.position) === -1) {
            el.style.position = 'relative';
        }

        if(!el.__loadingEl) {
            const loadingEl = createLoadingElement(el);
            el.appendChild(loadingEl);
            el.__loadingEl = loadingEl;
        }
    }
    else {
        const { __position, __loadingEl } = el;
        if(__position) {
            el.style.position = __position;
        }
        if(__loadingEl) {
            __loadingEl.remove();
            el.__loadingEl = null;
        }
    }
};
