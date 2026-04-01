# tztH5SaveData（H5持久化存储）

支持环境：新一代APP

写入 H5 存储的数据
* **持久化存储**： 是
* **写入**： H5 
* **读取**： H5 

## 方法说明

```typescript
/**
 * 磁盘缓存-写入H5存储的数据
 * @param aKey 键名
 * @param aValue 键值
 */
export async function tztH5SaveData(aKey: string, aValue: string): Promise<void>
```

## 使用示例

```javascript
import { tztH5SaveData } from '@crsec/tiny-utils'

// 写入字符串数据到 H5 存储
async function saveSimpleData() {
  await tztH5SaveData('H5_DATA_KEY', '存储数据')
}

// 写入 JSON 数据到 H5 存储
async function saveJsonData() {
  const configData = {
    theme: 'dark',
    fontSize: 16,
    showNotifications: true
  }
  await tztH5SaveData('USER_CONFIG', JSON.stringify(configData))
}
``` 