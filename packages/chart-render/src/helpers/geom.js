/**
 *
 * 有效的统一字段名称
 */

/**
 * @param {*} lineGeom
 * @param {*} param1
 */
function addLineGeomAttr(
    lineGeom,
    { lineWidth = 1, lineShapeType = 'line', lineDash = [0, 0], lineOpacity = 1 },
) {
    lineGeom
        .size(lineWidth)
        .shape(lineShapeType)
        .opacity(lineOpacity)
        .style({
            lineDash: lineDash,
        })
        .show();
}

function addPointGeomAttr(
    pointGeom,
    {
        enablePoint = false,
        pointOpaticy = 1,
        pointRadius = 5,
        pointShapeType = 'circle',
        pointBorderColor = '#cccccc',
        pointBorderWidth = 1,
        pointFillColor = '#cccccc',
    },
) {
    if (enablePoint === false) {
        pointGeom.hide();
        return;
    }
    pointGeom
        .opacity(pointOpaticy)
        .style({
            stroke: pointBorderColor,
            lineWidth: pointBorderWidth,
            fill: pointFillColor,
        })
        .size(pointRadius)
        .shape(pointShapeType)
        .show();
}

export { addLineGeomAttr, addPointGeomAttr };
