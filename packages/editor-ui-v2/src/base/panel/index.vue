<style lang="less">

    .eui-v2-panel {
        display: block;
    }
</style>

<script>
import SubPanel from '../sub-panel';

export default {
    props: {
        padding: {
            type: Boolean,
            default: () => false
        },
        light: {
            type: Boolean,
            default: () => false
        }
    },

    render(h) {
        const slots = this.$scopedSlots.default ? this.$scopedSlots.default() : this.$slots.default;
        const { padding, light } = this;
        // let hasSubPanel = false;
        const body = [];
        let tempPanel = [];

        if(!slots) {
            return null;
        }

        function appendPanel() {
            if(tempPanel.length > 0) {
                body.push(
                    <SubPanel padding={padding} light={light}>
                        { ...tempPanel }
                    </SubPanel>
                );
                tempPanel = [];
            }
        };
        slots.forEach(slot => {
            if(slot.tag === 'eui-v2-sub-panel' && !slot.componentOptions) {
                const data = slot.data || {};
                const attrs = data.attrs || {};
                const panelPadding = typeof attrs.padding !== 'undefined' ? attrs.padding === '' || attrs.padding : padding;
                const panelLight = typeof attrs.light !== 'undefined' ? attrs.light === '' || attrs.light : light;
                appendPanel();
                body.push(
                    <SubPanel padding={panelPadding} light={panelLight}>
                        { ...slot.children }
                    </SubPanel>
                );
            }
            else if(slot.componentOptions && slot.componentOptions.Ctor === SubPanel._Ctor[0]) {
                appendPanel();
                body.push(slot);
            }
            else if(slot.tag || slot.text.trim()) {
                tempPanel.push(slot);
            }
        });
        appendPanel();

        return (<div class="eui-v2-panel">
            { body }
        </div>);
    },
};
</script>
