export default {
    inserted(el) {
        el.addEventListener('focus', () => {
            el.select();
        });
    }
};
