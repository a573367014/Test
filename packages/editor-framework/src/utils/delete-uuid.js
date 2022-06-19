const deleteUUID = (elements, { deleteLinkId } = {}) => {
    if (!Array.isArray(elements)) {
        elements = [elements];
    }
    elements.forEach((ele) => {
        delete ele.uuid;

        if (deleteLinkId) {
            delete ele.linkId;
        }

        if (Array.isArray(ele.elements)) {
            deleteUUID(ele.elements);
        }
    });
};

export default deleteUUID;
