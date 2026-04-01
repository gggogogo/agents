# query

支持环境：新一代 APP、H5、PC

获取链接上参数，支持 hash 参数（如 vue-router）

## 方法说明

```typescript
/**
 * 获取链接上参数,支持 hash 参数（如 vue-router）
 * @param key 参数名
 * @param url 链接
 * @returns 参数值
 */
export function query(key?: string, url?: string): { [key: string]: string } | string
```

## 使用示例

```javascript
import { query } from '@crsec/tiny-utils'

// 常规参数解析
// url: https://h5.crsec.com.cn/biz-monorepo/digital-finance/etf.html?tabid=2
query('tabid') // 2

// 指定 URL 获取参数
query('tabid', 'https://h5.crsec.com.cn/biz-monorepo/digital-finance/etf.html?tabid=233') // 233

// hash 路由中的参数解析
// url: http://cicd-devops.crsec.com.cn/#/app/pipeline/run/7?pipelineId=072b8669dfc341c4bfe67dabc036f903&instNumber=4
query('pipelineId') // 072b8669dfc341c4bfe67dabc036f903
query('instNumber') // 4

// 获取所有参数
const allParams = query()
console.log(allParams.pipelineId) // 072b8669dfc341c4bfe67dabc036f903
```
