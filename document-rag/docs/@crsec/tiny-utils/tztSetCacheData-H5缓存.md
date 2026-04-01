# tztSetCacheData（H5缓存）

支持环境：新一代APP

写入数据到 APP 内存缓存中，关闭 APP 清空
* **持久化存储**： 否
* **写入**： H5 
* **读取**： H5 

## 方法说明

```typescript
/**
 * 内存缓存-写入数据
 * @param aKey 键名
 * @param aValue 键值
 */
export async function tztSetCacheData(aKey: string, aValue: string): Promise<void>
```

## 使用示例

```javascript
import { tztSetCacheData } from '@crsec/tiny-utils'

// 写入字符串数据到内存缓存
async function setSimpleData() {
  await tztSetCacheData('CACHE_KEY', '缓存数据')
}

// 写入 JSON 数据到内存缓存
async function setJsonData() {
  const userData = { id: 123, name: '用户名称', type: 'VIP' }
  await tztSetCacheData('USER_DATA', JSON.stringify(userData))
}
``` 