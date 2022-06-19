const getParamsFirstValue = (params) => {
    if (!params || !params.length) {
        return '';
    }
    return params[0];
};

module.exports = {
    getParamsFirstValue,
};
