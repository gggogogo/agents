# tztGetLocalData

支持环境：新一代 APP

获取 APP 存储值，通常由原生写入，H5 读取
* **持久化存储**： 是
* **写入**： 原生
* **读取**： 原生、H5

## 使用示例

```javascript
import { tztGetLocalData } from '@crsec/tiny-utils'

const res = await tztGetLocalData('WTURLData')
```
