const RESPONSE_STATUS = {
    SUCCESS: 200,
    NOT_TOKEN: 401,
    PARAM_ERROR: 40001, // 参数错误
    SYS_ERROR: 40000, // 系统错误
};

function success(data = {}, msg, sub_msg) {
    return {
        msg: msg || 'success',
        subMsg: sub_msg || '',
        data,
        status: RESPONSE_STATUS.SUCCESS,
    };
}

function errorParam(sub_msg, msg) {
    return {
        msg: msg || 'param error',
        subMsg: sub_msg || '',
        status: RESPONSE_STATUS.PARAM_ERROR,
    };
}

function error(sub_msg, msg, status = RESPONSE_STATUS.SYS_ERROR) {
    return {
        msg: msg || 'error',
        subMsg: sub_msg || '',
        status,
    };
}

module.exports = {
    success,
    error,
    errorParam,
    RESPONSE_STATUS,
};
