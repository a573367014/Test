/**
 * utils/string
 */
import { v4 as uuidv4 } from 'uuid';

export const uuid = () => {
    return uuidv4();
};

export const isBase64 = (str) => {
    return str && str.indexOf(';base64') > 0;
};

export default {
    uuid,
    isBase64,
};
