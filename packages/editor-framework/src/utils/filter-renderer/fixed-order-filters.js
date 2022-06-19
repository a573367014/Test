// https://doc.huanleguang.com/pages/viewpage.action?pageId=58644632
// 滤镜链先执行固定好排序的基础滤镜，非固定排序的基础和特效滤镜保持添加的顺序
// 下面基础滤镜顺序为数组的先后
export default [
    // '人像',
    {
        name: '磨皮',
    },
    {
        name: '美白',
    },
    {
        name: '肤色',
    },
    // '非颜色模块',
    {
        name: '曝光',
    },
    {
        name: '亮度',
    },
    {
        name: '对比度',
    },
    {
        name: '白色',
    },
    {
        name: '高光',
    },
    {
        name: '黑色',
    },
    {
        name: '阴影',
    },
    // '非颜色与颜色过渡模块',
    {
        name: '曲线',
    },
    // '颜色模块',
    {
        name: '色温',
    },
    {
        name: '色调',
    },
    {
        name: '自然饱和度',
    },
    {
        name: '饱和度',
    },
    {
        name: 'HSL面板',
    },
    // '质感',
    {
        name: '减少杂色',
    },
    {
        name: '清晰度',
    },
    {
        name: '锐化',
    },
    {
        name: '暗角',
    },
    {
        name: '颗粒',
    },
    // '其他',
    {
        name: '单色',
    },
    {
        name: '混合模式',
    },
];
