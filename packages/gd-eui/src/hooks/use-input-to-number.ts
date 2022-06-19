export const useInputToNumber = (value: number | string, lasterValue: number) => {
    if (/^\d+$/.test(value + '')) {
        return +value;
    }

    return lasterValue;
};
