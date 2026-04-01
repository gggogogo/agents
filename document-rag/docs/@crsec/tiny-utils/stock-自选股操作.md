# stock 自选股操作

支持环境：新一代APP

提供自选股的添加、删除、查询功能，支持分组管理。

## 方法说明

```typescript
// 股票信息
export interface Stock {
  stockCode: string | number // 股票代码
  market: string | number // 市场 0-深圳 1-上海(交易所编号)
  stockName?: string // 股票名称
  securityClass?: string | number // 股票大类 0-股票  1-基金 2-债券 3-权证/期权 4-期货 5-指数 9-其他
  securityType?: string | number // 股票小类
  securitySubType?: string | number // 股票细类
  securityName?: string // 股票名称
}

// 添加自选股参数
export interface StockParams {
  stockCode: string | number // 股票代码
  market: string | number // 市场 0-深圳 1-上海(交易所编号)
  stockName?: string // 股票名称
  groupid?: string | number // 分组id
}

/**
 * 添加自选股
 */
declare function addWatchlist(stock: StockParams): Promise<any>

/**
 * 从所有自选分组中删除自选股
 */
declare function removeWatchlist(stock: StockParams): Promise<any>

/**
 * 查询自选股列表
 */
declare function queryWatchlist(groupid?: string | number): Promise<Stock[]>
```

## 使用示例

### 添加自选股

```javascript
import { addWatchlist } from '@crsec/tiny-utils'

// 基本用法 - 添加股票到默认分组
addWatchlist({
  stockCode: '000001',
  market: 0, // 0-深圳 1-上海
  stockName: '平安银行'
}).then((res) => {
  console.log('添加成功', res)
}).catch((err) => {
  console.error('添加失败', err)
})

// 添加到指定分组
addWatchlist({
  stockCode: '600036',
  market: 1, // 上海
  stockName: '招商银行',
  groupid: '1' // 指定分组ID
}).then((res) => {
  console.log('添加成功', res)
})

// 不传股票名称（可选）
addWatchlist({
  stockCode: '000002',
  market: 0
}).then((res) => {
  console.log('添加成功', res)
})
```

### 删除自选股

```javascript
import { removeWatchlist } from '@crsec/tiny-utils'

// 从所有分组中删除自选股
removeWatchlist({
  stockCode: '000001',
  market: 0,
  stockName: '平安银行'
}).then((res) => {
  console.log('删除成功', res)
}).catch((err) => {
  console.error('删除失败', err)
})

// 删除时可以不传股票名称
removeWatchlist({
  stockCode: '600036',
  market: 1
}).then((res) => {
  console.log('删除成功', res)
})
```

### 查询自选股列表

```javascript
import { queryWatchlist } from '@crsec/tiny-utils'

// 查询默认分组的自选股
queryWatchlist().then((stockList) => {
  console.log('自选股列表:', stockList)
  // 输出格式:
  // [
  //   {
  //     stockCode: "000001",
  //     market: "0",
  //     securityClass: "0",
  //     securityType: "1",
  //     securitySubType: "0"
  //   }
  // ]
})

// 查询指定分组的自选股
queryWatchlist('1').then((stockList) => {
  console.log('分组1的自选股:', stockList)
})

// 处理查询结果
queryWatchlist().then((stockList) => {
  if (stockList.length > 0) {
    stockList.forEach((stock) => {
      console.log(`股票代码: ${stock.stockCode}`)
      console.log(`市场: ${stock.market === '0' ? '深圳' : '上海'}`)
      console.log(`股票大类: ${stock.securityClass}`)
    })
  } else {
    console.log('暂无自选股')
  }
})
```

### 综合示例

```javascript
import { addWatchlist, removeWatchlist, queryWatchlist } from '@crsec/tiny-utils'

// 自选股管理类
class WatchlistManager {
  // 添加多只股票到自选
  async addMultipleStocks(stocks) {
    const results = []
    for (const stock of stocks) {
      try {
        const result = await addWatchlist(stock)
        results.push({ success: true, stock, result })
      } catch (error) {
        results.push({ success: false, stock, error })
      }
    }
    return results
  }

  // 检查股票是否在自选中
  async isInWatchlist(stockCode, market, groupid) {
    const stockList = await queryWatchlist(groupid)
    return stockList.some(stock => 
      stock.stockCode === stockCode && stock.market == market
    )
  }

  // 切换自选状态
  async toggleWatchlist(stock) {
    const isInWatchlist = await this.isInWatchlist(
      stock.stockCode, 
      stock.market, 
      stock.groupid
    )
    
    if (isInWatchlist) {
      return await removeWatchlist(stock)
    } else {
      return await addWatchlist(stock)
    }
  }
}

// 使用示例
const manager = new WatchlistManager()

// 批量添加股票
const stocksToAdd = [
  { stockCode: '000001', market: 0, stockName: '平安银行' },
  { stockCode: '600036', market: 1, stockName: '招商银行' },
  { stockCode: '000002', market: 0, stockName: '万科A' }
]

manager.addMultipleStocks(stocksToAdd).then((results) => {
  console.log('批量添加结果:', results)
})

// 切换自选状态
manager.toggleWatchlist({
  stockCode: '000001',
  market: 0,
  stockName: '平安银行'
}).then((result) => {
  console.log('切换结果:', result)
})
```

## 参数说明

### StockParams 参数

| 参数名      | 类型                | 是否必填 | 说明                          |
| ----------- | ------------------- | -------- | ----------------------------- |
| `stockCode` | `string \| number`  | 是       | 股票代码                      |
| `market`    | `string \| number`  | 是       | 市场编号，0-深圳 1-上海       |
| `stockName` | `string`            | 否       | 股票名称                      |
| `groupid`   | `string \| number`  | 否       | 分组ID，不传则使用默认分组    |

### Stock 返回对象

| 参数名            | 类型                | 说明                                                    |
| ----------------- | ------------------- | ------------------------------------------------------- |
| `stockCode`       | `string \| number`  | 股票代码                                                |
| `market`          | `string \| number`  | 市场编号，0-深圳 1-上海                                 |
| `stockName`       | `string`            | 股票名称                                                |
| `securityClass`   | `string \| number`  | 股票大类：0-股票 1-基金 2-债券 3-权证/期权 4-期货 5-指数 9-其他 |
| `securityType`    | `string \| number`  | 股票小类                                                |
| `securitySubType` | `string \| number`  | 股票细类                                                |
| `securityName`    | `string`            | 股票名称                                                |

### 市场编号说明

| 值  | 说明   |
| --- | ------ |
| `0` | 深圳市场 |
| `1` | 上海市场 |

### 股票大类说明

| 值  | 说明       |
| --- | ---------- |
| `0` | 股票       |
| `1` | 基金       |
| `2` | 债券       |
| `3` | 权证/期权  |
| `4` | 期货       |
| `5` | 指数       |
| `9` | 其他       |

## 注意事项

1. **环境限制**：此功能仅在新一代APP中可用，在浏览器环境中会直接返回
2. **异步操作**：所有方法都是异步的，请使用 Promise 或 async/await 处理结果
3. **删除操作**：`removeWatchlist` 会从所有自选分组中删除指定股票
4. **分组管理**：分组ID可以是字符串或数字，不传则使用默认分组
5. **股票名称**：股票名称是可选的，但建议传入以提供更好的用户体验
6. **错误处理**：建议使用 try-catch 或 Promise.catch 处理可能的错误情况
