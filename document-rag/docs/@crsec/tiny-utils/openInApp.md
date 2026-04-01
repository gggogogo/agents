# openInApp

支持环境：H5

在移动设备中唤起 APP，并在APP中打开页面

#### 使用示例

```javascript
import { openInApp } from '@crsec/tiny-utils'

// 唤起 APP 后直接跳转
openInApp(url)

// 唤起 APP 后跳转并设置title
openInApp(url, {title:'页面标题'})

// 唤起 APP 后跳转并隐藏原生头部
openInApp(url,{hiddenTitle: true})

// 唤起 APP 后先登陆再跳转
openInApp(url,{login: true})

```
