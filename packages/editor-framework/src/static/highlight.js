import template from './highlight.html';

export default {
    name: 'highlight',
    template,
    props: ['currentLayout'],
    data() {
        return {
            elements: [],
        };
    },

    computed: {
        editor() {
            return this.$parent;
        },

        highlights() {
            const editor = this.editor;
            const containerRect = editor.containerRect;
            const shellRect = editor.shellRect;
            const zoom = editor.zoom;

            if (!this.currentLayout) {
                return [];
            }

            return this.elements.map((element) => {
                return {
                    left: shellRect.left + containerRect.scrollLeft + element.left * zoom,
                    top:
                        shellRect.top +
                        containerRect.scrollTop +
                        (element.top + this.currentLayout.top) * zoom,
                    width: element.width * zoom,
                    height: element.height * zoom,
                    transform: element.transform.toString(),
                    className: element.$highlightClass,
                };
            });
        },
    },

    methods: {
        add(appends, className) {
            const elements = this.elements;
            appends = [].concat(appends);
            appends.forEach((element) => {
                if (elements.indexOf(element) === -1) {
                    elements.push(element);
                }
                element.$highlightClass = className;
            });
        },

        replaceAll(newElems, className) {
            this.clear();
            this.add(newElems, className);
        },

        remove(removes) {
            const elements = this.elements;
            removes = [].concat(removes);
            removes.forEach((element) => {
                const index = elements.indexOf(element);
                if (index > -1) {
                    elements.splice(index, 1);
                    delete element.$highlightClass;
                }
            });
        },

        clear() {
            this.elements.forEach((element) => {
                delete element.$highlightClass;
            });
            this.elements = [];
        },
    },

    events: {
        'element.highlight'(elements, action = 'replaceAll', className = '') {
            if (elements) {
                this[action](elements, className);
            } else {
                this.clear();
            }
        },
    },
};
