# getServerTime

支持环境：新一代 APP

获取服务器时间，仅 APP 可用。

* 不要频繁请求该 API 获取服务器时间（减少低版本请求接口的次数），优先在项目中缓存一次设备时间与服务器时间差作为离线时间使用
* IOS/Android 原生均有缓存服务器时间的能力，优先读取缓存，读取失败或无缓存时请求接口获取最新服务器时间
* 鸿蒙系统不支持读取缓存服务器时间，直接请求接口获取最新服务器时间
* 需要 APP 版本 >= 6.2.6 才支持读取原生缓存时间

## 方法说明

```typescript
/**
 * 获取服务器时间
 * @returns 服务器时间字符串，格式 'YYYY-MM-DD HH:mm:ss'
 */
export async function getServerTime(): Promise<string>
```

## 使用示例

```javascript
import { getServerTime } from '@crsec/tiny-utils'

async function example() {
  const serverTime = await getServerTime()
  console.log('服务器时间:', serverTime) // 输出格式: '2025-11-17 14:45:13'
}
```

## 返回值说明

| 类型   | 说明                                         |
| ------ | -------------------------------------------- |
| string | 服务器时间字符串，格式为 'YYYY-MM-DD HH:mm:ss' |

## 注意事项

1. 仅在 APP 环境下可用
2. 读取原生缓存有 1 秒超时机制，超时后会降级请求接口获取
3. 如果获取失败，返回空字符串
