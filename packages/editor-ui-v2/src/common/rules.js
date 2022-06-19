// 缩放值验证
export const scaleValueRule = (a, min = 0.1, max = 10) => {
    if(!/^(\d+|\.\d|\d+\.\d)x?$/.test(a)) return false;
    const parsedValue = parseFloat(a);
    return parsedValue >= min && parsedValue <= max;
};
