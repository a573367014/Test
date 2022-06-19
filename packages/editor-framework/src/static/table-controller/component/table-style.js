export function appendTableStyle($table) {
    const $style = document.createElement('style');
    const styleText = `
    .table-main td:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        z-index: -1;
        background: inherit;
        width: 100%;
        height: 100%;
    }
    `;
    $style.appendChild(document.createTextNode(styleText));
    $table.appendChild($style);
}
