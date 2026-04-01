# tztH5ReadDataList

支持环境：新一代APP

一次性读取多个 APP 中 H5 存储的数据
* **持久化存储**： 是
* **写入**： H5 
* **读取**： H5 

## 方法说明

```typescript
/**
 * 磁盘缓存-读取H5存储的数据，一次性读取多个值
 * @param keyList 键名列表
 * @returns 包含所有键值对的对象
 */
export async function tztH5ReadDataList(keyList: string[]): Promise<void | Record<string, string>>
```

## 使用示例

```javascript
import { tztH5ReadDataList } from '@crsec/tiny-utils'

// 一次性读取多个 H5 存储的数据
async function readMultipleH5Data() {
  const dataMap = await tztH5ReadDataList(['USER_PREF', 'THEME', 'FAVORITES'])
  
  if (dataMap) {
    console.log('用户偏好设置:', dataMap.USER_PREF)
    console.log('主题设置:', dataMap.THEME)
    console.log('收藏列表:', dataMap.FAVORITES)
  }
} 