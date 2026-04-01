# getTokenType
支持环境：新一代APP

获取 yhttoken token type


## 使用示例

```javascript
import { getTokenType } from '@crsec/tiny-utils'

// 0 普通； 1 两融； 8 期权；
const tokenType = await getTokenType() 
```