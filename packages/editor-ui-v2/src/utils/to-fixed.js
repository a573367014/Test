export function toFixed(val, precision = 1) {
    val = parseFloat(val);
    return Number.isNaN(val)
        ? 0
        : parseFloat(val.toFixed(precision));
}
