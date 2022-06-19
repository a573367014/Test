import Vue from 'vue';

class LoadingService {
    constructor() {
        this.elementMap = {};
        this.elements = Vue.observable([]);
    }

    add(element) {
        const { elementMap, elements } = this;
        const id = element.$id;
        if(!elementMap[id]) {
            elementMap[id] = 0;
        }

        const loadingCount = elementMap[id];
        if(loadingCount === 0) {
            elements.push(element);
        }

        elementMap[id] = loadingCount + 1;
        return id;
    }

    remove(element) {
        const { elementMap, elements } = this;
        const id = element.$id;

        if(elementMap[id]) {
            const loadingCount = elementMap[id];
            if(loadingCount === 1) {
                this.elements = elements.filter((elem) => elem.$id !== id);
            }

            elementMap[id] = loadingCount - 1;
        }
    }
};

export const loadingService = new LoadingService();
