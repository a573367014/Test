import './rollup.config.base';
import cssConfigList from './rollup.config.css.build.js';
import contentConfigList from './rollup.config.build.js';

const configList = [];
configList.push(...cssConfigList, ...contentConfigList);

export default configList;
