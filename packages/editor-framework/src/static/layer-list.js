import template from './layer-list.html';
import ThumbnailImage from './thumbnail/image';
import ThumbnailVideo from './thumbnail/video';
import ThumbnailText from './thumbnail/text';
import ThumbnailGroup from './thumbnail/group';
import ThumbnailMask from './thumbnail/mask';
import ThumbnailSvg from './thumbnail/svg';
import ThumbnailTable from './thumbnail/table';
import ThumbnailCollage from './thumbnail/collage';
import ThumbnailThreeText from './thumbnail/three-text';
import ThumbnailStyledText from './thumbnail/styled-text';
import ThumbnailWatermark from './thumbnail/watermark';
import ThumbnailEffectText from './thumbnail/effect-text';
import ThumbnailLine from './thumbnail/line';
import ThumbnailBrush from './thumbnail/brush';
import ThumbnailRect from './thumbnail/rect';
import ThumbnailEllipse from './thumbnail/ellipse';
import ThumbnailArrow from './thumbnail/arrow';
import ThumbnailNinePatch from './thumbnail/nine-patch';
import ThumbnailBackgroundMosaicPath from './thumbnail/background-mosaic-path';
import ThumbnailFlex from './thumbnail/flex';

export default {
    name: 'layer-list',
    template,
    props: ['layerList', 'selectCall', '$events', 'editor', 'thumbnailClass'],
    data() {
        return {};
    },

    methods: {
        highlightElement(element, action, className) {
            this.$events.$emit('element.highlight', element, action, className);
        },
    },

    components: {
        ThumbnailImage,
        ThumbnailText,
        ThumbnailGroup,
        ThumbnailMask,
        ThumbnailSvg,
        ThumbnailTable,
        ThumbnailCollage,
        ThumbnailThreeText,
        ThumbnailStyledText,
        ThumbnailWatermark,
        ThumbnailEffectText,
        ThumbnailNinePatch,
        ThumbnailLine,
        ThumbnailBrush,
        ThumbnailEllipse,
        ThumbnailRect,
        ThumbnailArrow,
        ThumbnailMosaicRect: ThumbnailBackgroundMosaicPath,
        ThumbnailMosaicBrush: ThumbnailBackgroundMosaicPath,
        ThumbnailMosaicEllipse: ThumbnailBackgroundMosaicPath,
        ThumbnailFlex,
        ThumbnailVideo,
    },
};
