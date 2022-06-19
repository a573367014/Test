<style lang="less">

    .eui-v2-base-container {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }
</style>

<script>
import MainContainer from '../main-container';
import HeaderContainer from '../header-container';
import PanelContainer from '../panel-container';
import AsideContainer from '../aside-container';
import CollapseContainer from '../collapse-container';

const HEADER_BAR_HEIGHT = 54;
const ASIDE_BAR_WIDTH = 64;
const COLLAPSE_BAR_WIDTH = 270;
const PANEL_BAR_WIDTH = 276;

export default {
    render: function(h) {
        const vNodes = this.$slots.default;
        const header = [];
        const main = [];
        let body = null;
        let left = 0;
        let top = 0;
        let right = 0;
        const collapseGroup = {};
        vNodes.forEach((vNode, index) => {
            if(vNode.componentOptions) {
                if(!vNode.key) {
                    vNode.key = `container${index}`;
                }
                const { propsData, Ctor } = vNode.componentOptions;
                if(Ctor === HeaderContainer._Ctor[0]) {
                    propsData.__top = top;
                    propsData.__left = left;
                    const height = propsData.height || HEADER_BAR_HEIGHT;
                    top += height + 1;
                    header.push(vNode);
                }
                else if(Ctor === AsideContainer._Ctor[0]) {
                    propsData.__top = top;
                    const width = propsData.width || ASIDE_BAR_WIDTH;
                    if(body) {
                        propsData.__right = right;
                        right += width + 1;
                    }
                    else {
                        propsData.__left = left;
                        left += width + 1;
                    }
                    main.push(vNode);
                }
                else if(Ctor === CollapseContainer._Ctor[0]) {
                    propsData.__top = top;
                    const { collapsed, float, width, groupId } = propsData;
                    const collapseWidth = width || COLLAPSE_BAR_WIDTH;
                    propsData.__width = collapsed ? 0 : collapseWidth;

                    // 修正 1 像素的偏移
                    let _width = propsData.__width - 1;
                    let _left = left;
                    let _right = right;

                    if(body) {
                        propsData.__right = _right;
                        right += float || float === '' ? 0 : _width + 1;
                    }
                    else {
                        propsData.__left = _left;
                        left += float || float === '' ? 0 : _width + 1;
                    }

                    // 判断折叠栏是否在同一个组中
                    if(groupId) {
                        if(!collapseGroup[groupId]) {
                            collapseGroup[groupId] = [];
                        }
                        const collapses = collapseGroup[groupId];
                        if(collapses.length) {
                            const collapse = collapses[0];
                            _left = collapse._left;
                            _right = collapse._right;
                            if(body) {
                                propsData.__right = _right;
                            }
                            else {
                                propsData.__left = _left;
                            }
                        }
                        collapses.push({
                            _width,
                            _left,
                            _right,
                            float
                        });

                        const collapse = collapses.sort((a, b) => {
                            const aWdith = a.float ? 0 : a._width;
                            const bWidth = b.float ? 0 : b._width;
                            return bWidth - aWdith;
                        })[0];

                        if(body) {
                            right = collapse._right + (collapse.float || collapse.float === '' ? 0 : collapse._width + 1);
                        }
                        else {
                            left = collapse._left + (collapse.float || collapse.float === '' ? 0 : collapse._width + 1);
                        }
                    }
                    main.push(vNode);
                }
                else if(Ctor === PanelContainer._Ctor[0]) {
                    propsData.__top = propsData.__top || top;
                    const { collapsed, width } = propsData;
                    const panelWidth = width || PANEL_BAR_WIDTH;
                    propsData.__width = collapsed ? 0 : panelWidth;

                    // 修正 1 像素的偏移
                    let _width = propsData.__width;
                    let _left = left;
                    let _right = right;

                    if(body) {
                        propsData.__right = propsData.__right || _right;
                        right += _width;
                    }
                    else {
                        propsData.__left = _left;
                        left += _width;
                    }



                    main.push(vNode);
                }
                else if(Ctor === MainContainer._Ctor[0]) {
                    if(!body) {
                        propsData.__top = propsData.__top || top;
                        body = vNode;
                        main.push(body);
                    }
                }
            }
        });

        if(body) {
            const propsData = body.componentOptions.propsData;
            propsData.__left = left;
            propsData.__right = right;
        }
        return h('div', {
            class: 'eui-v2-base-container'
        }, [header, main]);
    }
};
</script>
