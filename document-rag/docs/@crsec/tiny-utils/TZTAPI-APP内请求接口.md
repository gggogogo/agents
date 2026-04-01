# TZTAPI

支持环境：新一代APP

基于 TZT 进行 http 请求，适用于后端服务接入中焯行情、交易、咨询、均衡的场景。

## 使用示例

**基础用法**

```javascript
import { TZTAPI, ReqlinkType } from '@crsec/tiny-utils'

// 创建实例 - 自定义配置
const tztAPI = new TZTAPI({
  action: '1237', // 后端提供的 action
  reqlinkType: ReqlinkType.NEWS, // 使用枚举：行情(MARKET)、交易(TRADE)、资讯(NEWS)
})

// 基础请求
export function getList(params) {
  return tztAPI.query('1000082', params) // funcNo：功能号，后端提供
}

// 带自定义配置的请求
export function getSpecialData(params) {
  return tztAPI.query(
    '1000083',
    params,
    { reqlinkType: ReqlinkType.TRADE, timeout: 10000 }, // 临时覆盖请求类型,timeout 单位毫秒
  )
}
```

**高级用法**

```javascript
// 不同请求类型示例
const marketAPI = new TZTAPI({
  action: '1237',
  reqlinkType: ReqlinkType.MARKET,
})

const tradeAPI = new TZTAPI({
  action: '5800',
  reqlinkType: ReqlinkType.TRADE,
})

const newsAPI = new TZTAPI({
  action: '1237',
  reqlinkType: ReqlinkType.NEWS,
})

// 处理返回数据
async function handleApiCall() {
  try {
    const result = await tztAPI.query('1000082', { param1: 'value1' })
    if (result.errorNo === 0) {
      console.log('请求成功:', result.results)
    } else {
      console.error('请求失败:', result.errorMsg)
    }
  } catch (error) {
    console.error('请求异常:', error)
  }
}
```

#### 接口说明

```typescript
export declare class TZTAPI {
  tztServiceConfig: TztServiceConfig
  options: TZTAPIOption | undefined
  constructor(tztServiceConfig?: TztServiceConfig, options?: TZTAPIOption)
  query<T = any, D = any>(
    funcNo: number | string,
    query: D,
    tztServiceConfig?: TztServiceConfig,
    config?: { NOJSONPARSE: boolean },
  ): Promise<TZTResponse<T> | T>
}

export interface TztServiceConfig extends SendData {
  [key: string]: any
}

interface SendData {
  action: string | number
  FuncNo?: number | string
  param?: string
  paramStr?: string
  reqlinkType: ReqlinkType
  tzttimeout?: number // 这个是原生会去读的请求超时时间，单位秒
  timeout?: number // 超时时间，但目前的tzt 实现中，只有在调试环境用 $.ajax 发送请求时透传给 $.ajax，单位毫秒
}

export enum ReqlinkType {
  MARKET = 0, // 行情
  TRADE = 1, // 交易
  NEWS = 2, // 资讯
}

export interface TZTAPIOption {
  debug?: boolean // 是否开启调试模式
  grpcBlackList?: string[] | number[] // grpc 黑名单
}

export interface TZTJSONRes {
  ACTION: string
  RESULT?: string
  BINDATA: string
  ERRORNO: string
  TZTUSEDTIME: string // 耗时
  URL: string // 真实请求ip+参数
}

export interface TZTResponse<T = any> {
  errorNo: number
  error_no?: number
  errorMsg: string
  results: T
}
```

#### 注意事项

1. **默认配置**: 如果不传入配置，默认使用 `{ action: '1237', reqlinkType: ReqlinkType.NEWS }`
2. **错误处理**:
   - `errorNo` 为 0 表示成功
   - `errorNo` 为 -10 会自动触发登录超时处理
   - 其他错误码需要业务方自行处理
3. **VConsole 支持**: 自动集成 VConsole 网络面板，方便调试
4. **数据类型**: 支持中焯转发服务（param）和 grpc 服务（paramStr）两种数据格式
