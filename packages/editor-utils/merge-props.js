export function mergeProps(objValue, srcValue) {
    if (typeof objValue === 'object' && srcValue === null) {
        return objValue;
    }
}
