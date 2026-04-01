# Share

支持环境：新一代APP、微信

在国新证券APP及微信环境中调用分享功能。`Share` 类会自动根据当前运行环境（APP / 微信）初始化对应的分享能力。

## 类型说明

```typescript
interface ShareOptions {
  message?: string // 分享的文本内容
  title?: string // 分享的标题
  url?: string // 分享的链接
  sharetype?: number // 分享渠道 0:微信 1:微信朋友圈 2:QQ好友 3:QQ空间 4:腾讯微博 5:新浪微博 99:客户端选择
  img_url?: string // 分享图片URL
  success?: (res: any) => void // 分享成功回调
  fail?: (err: any) => void // 分享失败回调
  complete?: (e: any) => void // 分享完成回调
  isBeta?: boolean // 是否是测试环境，默认为 undefined，true 表示测试环境，false 表示生产环境
}
```

## 默认配置

未传入的字段将使用以下默认值：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `message` | `'国新证券APP'` | 分享文本内容 |
| `title` | `'国新证券APP'` | 分享标题 |
| `url` | 当前页面完整地址（含 pathname、search、hash） | APP 内 `127.0.0.1` 时自动替换为线上/测试域名 |
| `sharetype` | `0` | 微信 |
| `img_url` | `'https://h5.crsec.com.cn/logo-rect.png'` | 默认分享图标 |

::: tip URL 自动处理
在 APP 环境中，如果当前 host 为 `127.0.0.1`（本地调试），`url` 会根据 `isBeta` 自动拼接为：

- 测试环境：`https://crqywxcs.crsec.com.cn:3007` + pathname + search + hash
- 生产环境：`https://newapp.crsec.com.cn:3007` + pathname + search + hash
:::

## 构造函数

```typescript
new Share(option: ShareOptions, nativeShareIcon?: boolean)
```

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `option` | `ShareOptions` | — | 分享配置项 |
| `nativeShareIcon` | `boolean` | `false` | 是否在 APP 导航栏显示原生分享图标 |

## 实例方法

### `share()`

手动触发分享，调用 APP 原生分享面板。

```typescript
const s = new Share(options)
s.share()
```

## 环境行为

- **微信环境**：自动加载微信 JS-SDK 并配置 `wx.config`，注册 `onMenuShareAppMessage` 和 `onMenuShareTimeline`，用户通过微信菜单即可分享。
- **APP 环境**：当 `nativeShareIcon` 为 `true` 时，会在原生导航栏注册分享按钮，点击后触发分享；也可调用 `share()` 方法手动触发。

## 使用示例

```javascript
import { Share } from '@crsec/tiny-utils'

// 基本用法：实例化后自动初始化分享（微信环境自动生效）
const s = new Share({
  title: '分享标题',
  message: '分享内容描述',
})

// 手动调用分享（APP 环境）
s.share()
```

```javascript
// 在 APP 中显示原生分享图标（前提：需要展示原生导航栏）
const s = new Share(
  {
    title: '分享标题',
    message: '分享内容描述',
  },
  true, // 开启原生导航栏分享图标
)
``` 