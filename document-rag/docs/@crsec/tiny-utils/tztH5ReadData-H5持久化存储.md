# tztH5ReadData

支持环境：新一代APP

获取 H5 存储的数据
* **持久化存储**： 是
* **写入**： H5 
* **读取**： H5 

## 方法说明

```typescript
/**
 * 磁盘缓存-读取H5存储的数据
 * @param aKey 键名
 * @returns 对应的值
 */
export async function tztH5ReadData(aKey: string): Promise<string | undefined>
```

## 使用示例

```javascript
import { tztH5ReadData } from '@crsec/tiny-utils'

// 读取 H5 存储的数据
async function readH5Data() {
  const data = await tztH5ReadData('H5_DATA_KEY')
  console.log('H5 存储数据:', data)
}
``` 