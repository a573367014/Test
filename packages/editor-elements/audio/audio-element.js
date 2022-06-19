import utils from '@gaoding/editor-framework/src/utils/utils';
import template from './audio-element.html';
import Promise from 'bluebird';

export default {
    name: 'audio-element',
    template,
    props: ['global', 'model', 'options', 'editor'],
    data() {
        return {
            audio: null,
        };
    },
    computed: {
        originUrl() {
            const { model, options } = this;
            return utils.getComputedUrl(model.url, options.fitCrossOrigin);
        },
    },
    watch: {
        'model.$currentTime'(time) {
            if (this.audio) {
                this.audio.currentTime = (time || 0) / 1000;
            }
        },
        'model.volume'(volume) {
            if (this.audio) {
                this.audio.volume = volume;
            }
        },
        'model.$playing'(playing) {
            if (!this.audio) return;

            if (playing) {
                this.audio.volume = this.model.volume;
                this.audio.play();
            } else {
                this.audio.pause();
            }
        },
    },
    methods: {
        checkLoad() {
            const { model, originUrl } = this;

            // loaded
            model.$loaded = false;

            return Promise.try(() => {
                return utils.loadAudio(originUrl, this.options.fitCrossOrigin);
            })
                .then(() => {
                    model.$loaded = true;
                    this.$events.$emit('element.loaded', model);
                })
                .catch((ex) => {
                    model.$loaded = true;
                    this.$events.$emit('element.loadError', ex, model);
                });
        },
    },
    mounted() {
        this.audio = this.$refs.audio;
        this.$nextTick(this.checkLoad);
    },
};
