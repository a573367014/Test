import BaseSchema from '../../base/base-column/base-schema';
import { pickSchemaWithProp } from '../../helpers/schema';

export default [
    ...pickSchemaWithProp(
        BaseSchema,
        'enableClipShape',
        'autoReverse',
        'opacity',
        'itemBorder',
        'itemTopRadiusRatio',
        'itemBottomRadiusRatio',
        'itemWidthRatio',
        'itemMaxWidth',
        'itemborderWidth',
        'itemborderColor',
    ),
];
