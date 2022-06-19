import './component-desc-group.less';

export default {
    render: function (h) {
        let children = this.$slots.default.filter((item) => {
            return item.tag;
        });
        if (children.length > 1) {
            children = children.map((element) => {
                return h(
                    'div',
                    {
                        class: 'component-desc-group__item',
                    },
                    [element],
                );
            });
        }
        return h(
            'div',
            {
                class: 'component-desc-group',
            },
            children,
        );
    },
};
