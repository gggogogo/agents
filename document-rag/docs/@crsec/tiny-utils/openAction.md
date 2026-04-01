# openAction

支持环境：新一代 APP

使用某个原生提供的[功能号](/funcNo/)

## 使用示例

```javascript
import { openAction } from '@crsec/tiny-utils'

// 添加自选基金
openAction(`http://action:50012/?`, {
    productCode: '',
    JsFuncName: 'callbackName'
})

```
