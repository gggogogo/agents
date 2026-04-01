# semverGTEWithTZT

支持环境：新一代 APP

判断原生能力是否可以在当前 APP 内使用，根据当前新一代 APP 版本与传入的版本做比较，如果大于等于传入的版本则返回 true，否则返回 false
## 使用示例

```javascript
import { semverGTEWithTZT } from '@crsec/tiny-utils'

const gte = await semverGTEWithTZT('5.0.3') // app 版本为 5.0.3、5.0.4。。。 则返回 tue，5.0.2 则返回 false

```
