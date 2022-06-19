export const snapshotRules = [
    {
        // 匹配 state 根节点结构
        match: ({ scope }) => scope === 'templet' || scope === 'layout',
        toRecord: (node) => ({
            chunks: [{ ...node, layouts: undefined }],
            children: node.layouts,
        }),
        fromRecord: ({ chunks, children }) => ({ ...chunks[0], layouts: children }),
    },
    {
        // 匹配 layout 及 group 结构
        match: (node) => !!node.elements,
        toRecord: (node) => ({
            chunks: [{ ...node, elements: undefined }],
            children: node.elements,
        }),
        fromRecord: ({ chunks, children }) => ({ ...chunks[0], elements: children }),
    },
    {
        match: (node) => node.type === 'image',
        toRecord: (node) => ({
            chunks: [{ ...node, url: undefined, imageUrl: undefined }, node.url, node.imageUrl],
            children: null,
        }),
        fromRecord: ({ chunks }) => ({ ...chunks[0], url: chunks[1], imageUrl: chunks[2] }),
    },
    {
        match: (node) => node.type === 'mask',
        toRecord: (node) => ({
            chunks: [{ ...node, url: undefined, mask: undefined }, node.url, node.mask],
            children: null,
        }),
        fromRecord: ({ chunks }) => ({ ...chunks[0], url: chunks[1], mask: chunks[2] }),
    },
    {
        match: (node) => node.type === 'text',
        toRecord: (node) => {
            return {
                chunks: [{ ...node, $editing: false }],
                children: null,
            };
        },
        fromRecord: ({ chunks }) => ({ ...chunks[0], $editing: false }),
    },
    // 对其它元素使用默认的序列化匹配规则即可
];
