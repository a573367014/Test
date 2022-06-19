export function getThreeTextKey(model, zoom = 1) {
    const relativeLetterSpacing = Math.floor((model.letterSpacing / model.fontSize) * 1000) / 1000;
    model.$relativeLetterSpacing = relativeLetterSpacing;
    let key =
        JSON.stringify(model.layers) +
        JSON.stringify(model.pointLights) +
        JSON.stringify(model.contents) +
        JSON.stringify(model.hemiLight) +
        JSON.stringify(model.environment) +
        JSON.stringify(model.shadow) +
        JSON.stringify(model.deformation) +
        JSON.stringify(model.warpByWord);

    key +=
        model.fontSize +
        zoom +
        model.content +
        model.lineHeight +
        relativeLetterSpacing +
        model.textAlign +
        model.writingMode +
        model.fontFamily +
        model.rotate3d +
        model.viewAngle +
        model.isOrtho +
        model.$showCoordinate +
        model.isFloodLightOff;
    return key;
}
