
# getTradeCalendar

支持环境：新一代 APP

获取交易日历数据，支持缓存机制。

- 请求接口时获取设备时间，默认获取前后各 45 天的交易日历
- 当交易日历缓存存在时，直接读取缓存，不存在时请求接口获取并缓存
- 设备时间距离交易日历最后一天小于 15 天时，重新请求接口获取交易日历并缓存

## 使用示例

```javascript
import { getTradeCalendar } from '@crsec/tiny-utils'

// 获取默认交易日历（前后各45天）
async function getDefaultCalendar() {
  const calendar = await getTradeCalendar()
  console.log('交易日历:', calendar)
}

// 获取指定日期范围的交易日历
async function getCustomCalendar() {
  const calendar = await getTradeCalendar({
    start: '20250101', // 注意格式 YYYYMMDD
    end: '20251231', // 注意格式 YYYYMMDD
    chinaMarket: 1, // 仅获取交易日
  })
  console.log('交易日历:', calendar)
}
```

## 方法说明

```typescript
interface TradeCalendarParams {
  start: string // 开始日期，格式 'YYYYMMDD'，如 '20250101'
  end: string // 结束日期，格式 'YYYYMMDD'，如 '20251231'
  chinaMarket?: number // 0-非交易日, 1-交易日，默认 1
  pageSize?: number // 每页条数，默认 90
}

interface TradeCalendarItem {
  actualDate: number // 实际日期，如 20250101
  chinaMarket: number // 0-非交易日, 1-交易日
  hkMarket: number // 0-非交易日, 1-交易日
  day: number // 日 1-31
  month: number // 月 1-12
  week: number // 星期几 1-7
  year: number // 年 2025
  id: number // 唯一标识
}

/**
 * 获取交易日历
 * @param params 查询参数（可选）
 * @returns 交易日历数组
 */
export async function getTradeCalendar(
  params?: TradeCalendarParams,
): Promise<TradeCalendarItem[] | undefined>
```

## 返回值说明

| 字段        | 类型   | 说明                               |
| ----------- | ------ | ---------------------------------- |
| actualDate  | number | 实际日期，格式 YYYYMMDD            |
| chinaMarket | number | 中国市场状态，0-非交易日, 1-交易日 |
| hkMarket    | number | 港股市场状态，0-非交易日, 1-交易日 |
| day         | number | 日，1-31                           |
| month       | number | 月，1-12                           |
| week        | number | 星期几，1-7                        |
| year        | number | 年份                               |
| id          | number | 唯一标识                           |

## 注意事项

1. 数据会自动缓存到 H5 持久化存储中
2. 缓存 key 为 `TZT_TRADE_CALENDAR`
3. 如果传入的日期范围在缓存范围内，会直接返回缓存数据
4. 请求失败时会降级使用缓存数据

