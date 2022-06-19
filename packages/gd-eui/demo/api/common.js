import axios from '../core/request';

export const jscpdPost = async () => {
    try {
        const res = await axios.post('/jscpd');
        if (res && res.status === 200 && res.data.status === 200) {
            return res.data;
        }
        return null;
    } catch (e) {
        console.log(e);
        return null;
    }
};

export const publishBetaPost = async () => {
    try {
        const res = await axios.post('/publish/beta');
        console.log('res', res);
        if (res && res.status === 200 && res.data.status === 200 && res.data.status === 200) {
            return res.data;
        }
        return null;
    } catch (e) {
        console.log(e);
        return null;
    }
};

export const testPost = async () => {
    try {
        const res = await axios.post('/test');
        if (res && res.status === 200 && res.data.status === 200) {
            return res.data;
        }
        return null;
    } catch (e) {
        console.log(e);
        return null;
    }
};

export const basePost = async (url, param = null) => {
    try {
        const res = await axios.post(`/${url}`, param);
        if (res && res.status === 200 && res.data.status === 200) {
            return res.data;
        }
        return null;
    } catch (e) {
        console.log(e);
        return null;
    }
};
