import rectUtils from '@gaoding/editor-utils/rect';
import transformMath from '@gaoding/editor-utils/transform-math';

export default {
    // 计算 element 中心点 绕 group 中心点旋转后的状态
    mergeTransform(parent, element) {
        // default data
        const result = {
            left: element.left,
            top: element.top,
            transform: element.transform,
        };

        const center = {
            x: element.left + element.width / 2,
            y: element.top + element.height / 2,
        };

        const parentTransform = parent.transform;
        const point = rectUtils.getPointPosition(
            center,
            {
                x: parent.width / 2,
                y: parent.height / 2,
            },
            transformMath.radToDeg(parentTransform.rotation),
        );

        const dx = point.x - center.x;
        const dy = point.y - center.y;

        result.left = element.left + parent.left + dx;
        result.top = element.top + parent.top + dy;

        const cloneTransform = element.parseTransform(element.transform);
        cloneTransform.rotation += parent.transform.rotation;
        result.transform = cloneTransform;

        return result;
    },
};
