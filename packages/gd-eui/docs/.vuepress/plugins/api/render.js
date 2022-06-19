module.exports = class Render {
    constructor(res, options) {
        this.res = res;
        this.options = options;
        this.options = Object.assign(
            {},
            {
                props: ['属性', '说明', '类型', '必填', '可选值', '默认值'],
                events: ['事件名', '说明', '回调参数'],
                slots: ['插槽名', '说明', '默认模板'],
                methods: ['方法名', '说明', '传入参数'],
            },
            this.options,
        );
    }
    render() {
        const { props, slots, events, methods } = this.res;
        let md = {};
        if (props) {
            md.props = this.propRender(props);
        }
        if (slots) {
            md.slots = this.slotRender(slots);
        }
        if (events) {
            md.events = this.eventRender(events);
        }
        if (methods) {
            md.methods = this.methodRender(methods);
        }
        return md;
    }
    propRender(propsRes) {
        const propConfig = this.options.props;
        let code = this.renderTabelHeader(propConfig);
        propsRes.forEach((prop) => {
            const row = [];
            for (let i = 0; i < propConfig.length; i++) {
                if (propConfig[i] === '属性') {
                    row.push(prop.name);
                } else if (propConfig[i] === '说明') {
                    let desc = ['-'];
                    if (prop.describe && prop.describe.length) {
                        desc = prop.describe;
                        if (prop.validatorDesc) {
                            desc = prop.describe.concat(prop.validatorDesc);
                        }
                    }
                    row.push(desc[0]);
                } else if (propConfig[i] === '类型') {
                    const typeValue = prop.describe.find((val) => val.indexOf('Type') !== -1);
                    const _type = typeValue && typeValue.split(':')[1];
                    if (_type) {
                        row.push(_type);
                    } else if (prop.typeDesc) {
                        row.push(prop.typeDesc.join(''));
                    } else if (!prop.type) {
                        row.push('—');
                    } else if (typeof prop.type === 'string') {
                        row.push(`${prop.type}`);
                    } else if (Array.isArray(prop.type)) {
                        row.push(
                            prop.type
                                .map((t) => `${t} / `)
                                .join('')
                                .slice(0, -3),
                        );
                    } else {
                        row.push('-');
                    }
                } else if (propConfig[i] === '必填') {
                    if (typeof prop.required === 'undefined') {
                        row.push('false');
                    } else if (typeof prop.required === 'boolean') {
                        row.push(`${String(prop.required)}`);
                    } else {
                        row.push('-');
                    }
                } else if (propConfig[i] === '可选值') {
                    const optionValue = prop.describe.find(
                        (val) => val.indexOf('OptionalValue') !== -1,
                    );
                    const value = optionValue && optionValue.split(':')[1];
                    // console.log('optionValue', optionValue, value);
                    if (value) {
                        row.push(value);
                    } else {
                        row.push('-');
                    }
                } else if (propConfig[i] === '默认值') {
                    if (prop.defaultDesc) {
                        row.push(prop.defaultDesc.join(''));
                    } else if (prop.default) {
                        let str = prop.default;
                        if (typeof str === 'object') {
                            str = JSON.stringify(prop.default).replace(/\\n/g, '');
                        } else if (
                            typeof str === 'string' &&
                            (str.indexOf('return') > -1 || str.indexOf('default()' > -1))
                        ) {
                            try {
                                str = new Function(str.match(/{([\s\S]*)}/)[1])();
                                if (str === undefined) str = '-';
                                else if (typeof str === 'object') str = JSON.stringify(str);
                            } catch (error) {}
                        } else if (typeof str === 'boolean') {
                            str = String(str);
                        }
                        row.push(str);
                    } else {
                        row.push('-');
                    }
                } else {
                    row.push('-');
                }
            }
            code += this.renderTabelRow(row);
        });
        return code;
    }
    slotRender(slotsRes) {
        const slotConfig = this.options.slots;
        let code = this.renderTabelHeader(slotConfig);
        slotsRes.forEach((slot) => {
            const row = [];
            for (let i = 0; i < slotConfig.length; i++) {
                if (slotConfig[i] === '插槽名') {
                    row.push(slot.name);
                } else if (slotConfig[i] === '说明') {
                    if (slot.describe) {
                        row.push(slot.describe);
                    } else {
                        row.push('-');
                    }
                } else if (slotConfig[i] === '默认模板') {
                    if (slot.backerDesc) {
                        row.push(slot.backerDesc);
                    } else {
                        row.push('-');
                    }
                } else {
                    row.push('-');
                }
            }
            code += this.renderTabelRow(row);
        });
        return code;
    }
    eventRender(propsRes) {
        const eventConfig = this.options.events;
        let code = this.renderTabelHeader(eventConfig);
        propsRes.forEach((event) => {
            // console.log('event', event);
            const row = [];
            for (let i = 0; i < eventConfig.length; i++) {
                if (eventConfig[i] === '事件名') {
                    row.push(event.name);
                } else if (eventConfig[i] === '说明') {
                    if (event.describe && event.describe.length) {
                        row.push(event.describe.join(''));
                    } else {
                        row.push('-');
                    }
                } else if (eventConfig[i] === '回调参数') {
                    if (event.argumentsDesc) {
                        row.push(event.argumentsDesc.join(''));
                    } else {
                        row.push('-');
                    }
                } else {
                    row.push('-');
                }
            }
            code += this.renderTabelRow(row);
        });
        return code;
    }
    methodRender(slotsRes) {
        const methodConfig = this.options.methods;
        let code = this.renderTabelHeader(methodConfig);
        slotsRes.forEach((method) => {
            const row = [];
            for (let i = 0; i < methodConfig.length; i++) {
                if (methodConfig[i] === '方法名') {
                    row.push(method.name);
                } else if (methodConfig[i] === '说明') {
                    if (method.describe) {
                        row.push(method.describe.join(''));
                    } else {
                        row.push('-');
                    }
                } else if (methodConfig[i] === '传入参数') {
                    if (method.argumentsDesc) {
                        row.push(method.argumentsDesc.join(''));
                    } else {
                        row.push('-');
                    }
                } else {
                    row.push('-');
                }
            }
            code += this.renderTabelRow(row);
        });
        return code;
    }
    renderTabelHeader(header) {
        const headerString = this.renderTabelRow(header);
        const splitLine = this.renderSplitLine(header.length);
        return headerString + splitLine + '\n';
    }
    renderTabelRow(row) {
        const table = row.map((n) => `|${n}`).join('') + '|\n';
        return table;
    }
    renderSplitLine(num) {
        let line = '';
        for (let i = 0; i < num; i++) {
            line += '|---';
        }
        return line + '|';
    }
};
