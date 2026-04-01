# tztGetCacheData

支持环境：新一代APP

读取 APP 内存缓存中的数据，关闭 APP 清空
* **持久化存储**： 否
* **写入**： 原生
* **读取**： 原生

## 方法说明

```typescript
/**
 * 内存缓存-读取数据
 * @param aKey 键名
 * @returns 对应的值
 */
export async function tztGetCacheData(aKey: string): Promise<string | undefined>
```

## 使用示例

```javascript
import { tztGetCacheData } from '@crsec/tiny-utils'

// 读取内存缓存
async function getData() {
  const data = await tztGetCacheData('CACHE_KEY')
  console.log('缓存数据:', data)
  
  // 读取 JSON 数据
  try {
    const jsonData = JSON.parse(data || '{}')
    console.log('解析后的数据:', jsonData)
  } catch (error) {
    console.error('数据解析失败')
  }
} 