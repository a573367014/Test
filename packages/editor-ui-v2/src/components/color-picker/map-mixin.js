export default {
    props: {
        map: {
            type: Object,
            default: () => {}
        },
        uploadImage: {
            type: Function,
            default: () => {
                throw new Error('需要实现图片上传');
            }
        },
    }
};
