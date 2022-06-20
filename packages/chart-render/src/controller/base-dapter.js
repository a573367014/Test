import { combine } from '../helpers/index';
import EventEmitter from 'wolfy87-eventemitter';
import { merge } from '@antv/g2/lib/util';
/**
 * 基础的设配器模板类
 * @class BaseAdapter
 */
export default class BaseAdapter extends EventEmitter {
    /**
     * 开关
     */
    get enable() {
        return this.config && this.config.enable;
    }

    /**
     * 获取默认值
     */
    getDefaultCfg() {
        return {
            enable: false,
        };
    }

    /**
     * @constructor
     * @param {Object} cfg
     */
    constructor(cfg) {
        super();
        this.config = null;
        this.g2Config = null;
        // hooks
        this._beforeInit();
        this._initCfg(cfg);
    }

    _beforeInit() {}

    /**
     * 初始化过程
     * @param {Object} cfg
     */
    _initCfg(cfg) {
        // 初始化默认值
        this.config = this._initDefault(cfg);
        // 组装g2Config
        this.assembleConfigToG2();
    }

    /**
     * 初始化默认值
     * @param {Obejct} cfg
     */
    _initDefault(cfg = {}) {
        return combine(cfg, this.config ? this.config : this.getDefaultCfg());
    }

    /**
     * 改变配置
     * @param {Obejct} cfg
     */
    changeConfig(cfg, isHandleUpdate = false) {
        this.config = merge(this.config, cfg);
        // 组装g2Config
        this.assembleConfigToG2();
        isHandleUpdate && this.emit('update', this.config, this.g2Config);
    }

    /**
     * 组合G2的参数
     */
    assembleConfigToG2() {
        this.g2Config = this.enable ? this.buildG2Config(this.config) : null;
    }

    /**
     * 根据配置config生成 G2 config 配置对象
     * @override
     */
    buildG2Config() {
        return {};
    }

    /**
     * 获取G2Config
     */
    getG2Config() {
        return this.g2Config;
    }
}
