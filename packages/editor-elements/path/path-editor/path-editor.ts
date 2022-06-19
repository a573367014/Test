import { PropType } from 'vue';
// @ts-ignore vue html template
import template from './path-editor.html';
import type { IPathElementModel, IVPEditor } from '@gaoding/editor-framework/src/types/editor';
import { PathService } from '../service';
import {
    defineComponent,
    onMounted,
    watch,
    ref,
    onBeforeUnmount,
    computed,
} from '@vue/composition-api';
import { i18n } from '../../i18n';

export const PathEditor = defineComponent({
    name: 'path-editor',
    props: {
        editor: {
            required: true,
            type: Object as PropType<IVPEditor>,
        },
        model: {
            required: true,
            type: Object as PropType<IPathElementModel>,
        },
    },
    setup(props) {
        const wrap = ref<HTMLDivElement>();
        let service: PathService;

        const style = computed(() => {
            let top = 0;
            if (props.editor.mode === 'flow') {
                top = (props.editor?.currentLayout?.top || 0) * props.editor.zoom;
            }
            return {
                position: 'absolute',
                left: 0,
                top: top + 'px',
                width: (props.editor?.currentLayout?.width || 0) * props.editor.zoom + 'px',
                height: (props.editor?.currentLayout?.height || 0) * props.editor.zoom + 'px',
                zIndex: 10,
            };
        });

        watch(
            () => props.model && props.model.$editing,
            (newValue) => {
                if (newValue) initPathEditing();
                else exitPathEditing();
            },
        );

        watch(
            () => ({
                strokeColor: props.model.$currentPathEffect.color,
                strokeType: props.model.$currentPathEffect.lineType,
                strokeWidth: props.model.$currentPathEffect.width,
                fillColor: props.model.$currentPathEffect.filling,
                opacity: props.model.opacity,
            }),
            () => {
                props.model && props.model.$editing && service.context.loadStyle(props.model);
            },
        );

        const mousemoveHandler = (e: MouseEvent) => {
            if (!service.context.state.isShapeTool) return;
            const classList = (e.target as HTMLElement).classList;
            if (classList.contains('editor-container') || classList.contains('editor-shell-wrap')) {
                props.editor.cursorController.fixedCursor('markTips', {
                    tip: i18n.$tsl('移动到画布中绘制'),
                });
            } else {
                service.context.setCursor(service.context.state.toolType);
            }
        };

        onMounted(() => {
            service = props.editor.services.cache.get('path') as PathService;
            if (props.model.$editing) initPathEditing();
        });

        onBeforeUnmount(() => {
            recoverEditorState();
        });

        // 点击画布外取消选中
        function editorContainerClickHandler(e) {
            if (
                e.target?.classList.contains('editor-container') ||
                e.target?.classList.contains('editor-shell-wrap')
            ) {
                props.model.$editing = false;
            }
        }

        async function initPathEditing() {
            if (wrap.value.childNodes.length > 0) return;

            wrap.value.appendChild(service.context.canvas);

            watch(
                () => props.editor.shellRect.width + props.editor.shellRect.height,
                () => {
                    service.context.fitZoom();
                },
            );

            props.editor.$refs.transform.visible = false;
            props.editor.$events.dispatchMouseEvent = false;
            service.context.loadModel();
            service.context.fitZoom();
            service.context.undoManager.makeSnapshot();

            setTimeout(() => {
                service.context.canvas.focus();
                props.editor.$refs.container?.addEventListener(
                    'click',
                    editorContainerClickHandler,
                );

                if (document.activeElement === service.context.canvas)
                    document.body.addEventListener('mousemove', mousemoveHandler);
            });
        }

        function exitPathEditing() {
            recoverEditorState();
            service.context.exportModel();
        }

        function recoverEditorState() {
            document.body.removeEventListener('mousemove', mousemoveHandler);
            props.editor.$refs.container?.removeEventListener('click', editorContainerClickHandler);
            props.editor.cursorController.cancelFixed('default');

            if (props.model.$editing) props.model.$editing = false;
            if (props.editor.$refs.transform) props.editor.$refs.transform.visible = true;
            service.context.canvas?.parentNode && wrap.value.removeChild(service.context.canvas);
            props.editor.$events.dispatchMouseEvent = true;
        }

        return {
            wrap,
            style,
        };
    },
    template,
});
