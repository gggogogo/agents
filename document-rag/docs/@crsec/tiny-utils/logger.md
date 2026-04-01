# Logger

支持环境：新一代APP

统一的 Web 日志记录工具，支持 APM（火山 APM）和 TZT（原生桥接口）两种日志源，提供灵活的日志记录能力。

## 使用示例

**基础用法**

```javascript
import logger from "@crsec/tiny-utils";

// 使用默认的 APM 日志源
logger.info('用户登录成功', { userId: '12345', loginType: 'password' });
logger.error('API 请求失败', { api: '/api/user', errorCode: 500 });

// 记录 API 调用日志
logger.api(
  {
    url: '/api/getData',
    params: { page: 1, size: 10 },
    response: { code: 0, data: [...] }
  },
  'actionxxxx', // 后端提供的 action，方便分组
);
```

**切换日志源**

```javascript
import logger from '@crsec/tiny-utils'

// 默认使用 APM 日志源
logger.info('这是 APM 日志')

// 切换到 TZT 日志源
logger.setLoggerSource('tzt')
logger.info('这是 TZT 日志', { tag: 'USER_ACTION' })

// 查看当前日志源
console.log(logger.getLoggerSource()) // 'tzt'

// 切换回 APM
logger.setLoggerSource('apm')
```

**直接使用特定日志源**

```javascript
import logger, { APMLogger, TZTLogger } from '@crsec/tiny-utils'

// 直接使用 APM Logger
const apmLogger = logger.getAPMLogger()
apmLogger.info('APM 专用日志', { module: 'payment' })

// 直接使用 TZT Logger
const tztLogger = logger.getTZTLogger()
tztLogger.info('USER_ACTION', '用户点击按钮')

// 或者直接创建新实例
const customAPM = new APMLogger()
const customTZT = new TZTLogger()
```

**错误处理和调试**

```javascript
import logger from '@crsec/tiny-utils'

// 记录不同级别的日志
logger.debug('调试信息', { step: 'validation' })
logger.info('正常信息', { action: 'submit_form' })
logger.warn('警告信息', { warning: 'deprecated_api' })
logger.error('错误信息', { error: 'network_timeout', retry: 3 })

// API 错误日志
try {
  const result = await apiCall()
  logger.api(result, 'action5855', { success: 1 })
} catch (error) {
  logger.api({ error: error.message }, 'action5855', { success: 0 })
}
```


#### 接口说明

```typescript
export declare class Logger {
  constructor(defaultSource?: LoggerSource)

  // 日志源管理
  setLoggerSource(source: LoggerSource): void
  getLoggerSource(): LoggerSource

  // 通用日志方法
  log(level: LoggerLevel, message: any, extra?: { [key: string]: string | number }): void
  debug(message: any, extra?: { [key: string]: string | number }): void
  info(message: any, extra?: { [key: string]: string | number }): void
  warn(message: any, extra?: { [key: string]: string | number }): void
  error(message: any, extra?: { [key: string]: string | number }): void
  api(message: any, action?: number | string, extra?: { [key: string]: string | number }): void

  // TZT 特有方法
  tztLog(tag: string, message: string, level?: LoggerLevel): void

  // 获取具体 Logger 实例
  getAPMLogger(): APMLogger
  getTZTLogger(): TZTLogger
}

export declare class APMLogger {
  log(level: LoggerLevel, message: any, extra?: { [key: string]: string | number }): void
  debug(message: any, extra?: { [key: string]: string | number }): void
  info(message: any, extra?: { [key: string]: string | number }): void
  warn(message: any, extra?: { [key: string]: string | number }): void
  error(message: any, extra?: { [key: string]: string | number }): void
  api(message: any, action: number | string, extra?: { [key: string]: string | number }): void
}

export declare class TZTLogger {
  clientVolcLog(obj: TZTLogParams, fnSuccess?: () => {}): void
  log(level: string, tag: string, message: any): void
  debug(tag: string, message: any): void
  info(tag: string, message: any): void
  warn(tag: string, message: any): void
  error(tag: string, message: any): void
  api(message: any): void
}

// 类型定义
type LoggerLevel = 'debug' | 'info' | 'warn' | 'error'
type LoggerSource = 'apm' | 'tzt'

interface TZTLogParams {
  level: string
  tag: string
  message: string
}
```

#### 注意事项

1. **默认配置**: Logger 默认使用 APM 日志源，可通过 `setLoggerSource()` 切换
2. **APM 日志要求**:
   - 需要 `window.APM_PLUS_WEB` 函数可用
   - 消息会自动转换为 JSON 字符串格式
3. **TZT 日志要求**:
   - 需要 `window.TZT` 对象可用
   - 需要提供 `action` 参数作为日志标识
   - 消息会包含页面路径和完整数据结构
4. **数据安全**:
   - 对象属性会通过 `sanitizeObject` 函数处理，确保可序列化
   - 无法序列化的属性会被移除并输出警告
5. **兼容性**:
   - 提供全局兼容对象 `window.APM_LOGGER` 和 `window.TZT_APM_LOGGER`
   - 支持旧版本 TZT 日志接口
6. **性能考虑**:
   - 日志记录是异步的，不会阻塞主线程
   - 建议在生产环境适当控制日志输出量
