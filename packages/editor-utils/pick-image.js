import pickFile from './pick-file';
import ua from './ua';

const pickImage = (options = {}) => {
    if (!options) {
        options = {};
    }

    if (!options.accept) {
        options.accept = !ua.isAndorid() ? 'image/png,image/jpeg,image/gif' : 'image/*';
    }

    return pickFile(options);
};

export default pickImage;
