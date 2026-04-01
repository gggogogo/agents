# watchlist - 自选股管理

支持环境：新一代APP

在国新证券APP中进行自选股的添加、删除和查询操作

## 接口说明

```typescript
// 添加自选股参数
interface StockParams {
  stockCode: string | number // 股票代码
  market: string | number // 市场（行情3.0）
  stockName?: string // 股票名称（可选）
  groupid?: string | number // 分组id（可选）
}

// 添加自选股
export async function addWatchlist(stock: StockParams): Promise<any>

// 删除自选股
export async function removeWatchlist(stock: StockParams): Promise<any>

// 查询自选股列表
export async function queryWatchlist(groupid: string | number): Promise<Stock[]>
```

## 使用示例

```javascript
import { addWatchlist, removeWatchlist, queryWatchlist } from '@crsec/tiny-utils'

// 添加自选股
addWatchlist({
  stockCode: '000001',
  market: 0, // 中焯市场编号，根据实际接口参数填写
})

// 删除自选股
removeWatchlist({
  stockCode: '000001',
  market: 0, // 中焯市场编号，根据实际接口参数填写
})

// 查询自选股列表
queryWatchlist().then((stockList) => {
  console.log('自选股列表:', stockList)
  // 返回格式：
  // [
  //   {
  //     stockCode: '000001',
  //     market: 0,
  //     securityClass: 0,
  //     securityType: 1,
  //     securitySubType: 0
  //   }
  // ]
})
```