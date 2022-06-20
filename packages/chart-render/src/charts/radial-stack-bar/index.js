import RadialBar from '../radial-bar/index';

export default class RadialStackBar extends RadialBar {
    _initGeom() {
        super._initGeom();
        this.geom.adjust({
            type: 'stack',
        });
    }

    _initPointStyle() {
        this.pointGeom.hide();
    }
}
