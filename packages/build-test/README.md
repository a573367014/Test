# @gaoding/private-assets
该包为个人资产访问限制兜底方案

> 基于service worker代理的方案：https://npm.gaoding.com/package/@gaoding/gd-service-worker


## 能力

- 封装单一组件，代替(img/video/audio/css url)等标签、样式
- 提供接口，处理 `auth_key` 替换、过期刷新、缓存等策略


## 使用
API 方式调用
```js
async function getAuthKey() {
    const client = await getOauth2Client();
    const authorization = await client.getAuthorizationHeader();
    return axios
        .get(getSolutionPath('/api/filems/access/token'), {
            headers: {
                Authorization: authorization || undefined,
            },
        })
        .then((res) => {
            return res.data;
        })
        .catch((e) => {
            // @ts-ignore
            gdReporterError(e, {
                msg: '资源 auth_key 获取失败',
            });
        });
}
const privateAssets = new PrivateAssets(getAuthKey as unknown as TGetAuthKey);
privateAssets.getPrivateUrl('https://gd-filems.com/xxx.png').then(url =>
```

组件方式调用
```html
<template>
    <div>
        <CustomElement
            tag="video"
            controls
            width="1000px"
            :cstyle="{
                background:
                    'url(https://gd-filems.dancf.com/mcm79j/mcm79j/87768/81c32d35-9c8f-41f7-8d8b-4c1c1d301a621629046.png?x-oss-process=image/resize,w_204,h_204,m_fill/interlace,1,image/format,webp)',
            }"
            src="https://gd-filems.dancf.com/mcm79j/mcm79j/94408/4113a8fc-6eb2-4b6d-8b22-0c825e8b81ce33143.mp4"
        ></CustomElement>
    </div>
</template>

<script>
import Vue from 'vue';
import { privateAssets } from '@gaoding/editor-common/services/private-assets';

const privateAssets = new PrivateAssets(getAuthKey as unknown as TGetAuthKey);
// 图片编辑器相关
export default {
    components: {
        CustomElement: privateAssets.component,
    }
};
</script>

```