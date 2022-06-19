import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
// @ts-ignore VueTemplate
import template from './path-element.html';
import { IPathElementModel, IVPEditor } from '@gaoding/editor-framework/src/types/editor';
import PathModel from './model';
import { PathRenderer } from './path-renderer';
import type { PathService } from './service';
import { ref, computed, watch, onMounted } from '@vue/composition-api';

interface IPathElementProps {
    editor: IVPEditor;
    model: IPathElementModel;
    global: {
        zoom: number;
    };
}

export default inherit(BaseElement, {
    name: 'path-element',
    template,
    setup({ model, editor, global }: IPathElementProps) {
        const canvas = ref<HTMLCanvasElement>(null);
        let renderer: PathRenderer;
        const service = editor.services.cache.get('path') as PathService;
        const canEditPath = service.canEditPath(model);

        const zoom = computed(() => global.zoom);

        const canvasStyle = computed(() => {
            return {
                position: 'absolute',
                left: 0,
                top: 0,
                transformOrigin: '0 0',
            };
        });

        const imgStyle = computed(() => {
            const { left, top, width, height } = (model as any).effectedResult;
            return {
                position: 'absolute',
                left: left * zoom.value + 'px',
                top: top * zoom.value + 'px',
                width: width * zoom.value + 'px',
                height: height * zoom.value + 'px',
            };
        });

        const wrapStyle = {
            lineHeight: 0,
        };

        const renderData = computed(() => {
            if (!canEditPath) return {};
            return {
                path: model.path,
                fillColor: model.$currentPathEffect.filling,
                strokeType: model.$currentPathEffect.lineType,
                strokeColor: model.$currentPathEffect.color,
                strokeWidth: model.$currentPathEffect.width,
                zoom: zoom.value,
                radius: model.radius,
            };
        });

        watch(renderData, () => {
            if (!canEditPath) return;
            renderer.render(zoom.value);
        });

        onMounted(() => {
            renderer = new PathRenderer(model, canvas.value);
            renderer.render(zoom.value);
        });

        return {
            canvas,
            renderData,
            canvasStyle,
            imgStyle,
            wrapStyle,
            canEditPath,
        };
    },
});
