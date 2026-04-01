# env

支持环境：新一代APP、H5、PC



当前页面所在环境判断



#### 使用示例

```javascript
import { env } from '@crsec/tiny-utils'

// 是否是新一代 APP
env.isAPP
```



#### 支持环境

| 名称            | 说明                 | 备注                                                         |
| --------------- | -------------------- | :----------------------------------------------------------- |
| isAPP           | 是否是APP环境        |                                                              |
| isBrowser       | 是否是浏览器环境     |                                                              |
| isNode          | 是否是Node环境       |                                                              |
| isIOS           | 是否是IOS            |                                                              |
| isAndroid       | 是否是Android        |                                                              |
| isBeta          | 是否测试环境         | 参数中携带_\_crsec-beta\_\_=1，或域名中包含 localhost、local、sit-static.crsec.com.cn、crqywxcs.crsec.com.cn 会被识别为测试环境 |
| isWX            | 是否是微信环境       |                                                              |
| isWXMiniProgram | 是否是微信小程序环境 |                                                              |

