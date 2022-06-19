import './cursor.less';

export default function(el, binding) {
    const classList = el.classList;
    classList.add('eui-v2-cursor');
    const value = binding.value;
    const oldValue = binding.oldValue;
    if(oldValue) {
        classList.remove(`eui-v2-cursor-${oldValue}`);
    }
    if(value) {
        classList.add(`eui-v2-cursor-${value}`);
    }
};
