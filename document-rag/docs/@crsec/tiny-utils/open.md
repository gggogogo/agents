# open

支持环境：新一代APP、H5、PC

打开新的 h5 页面，在浏览器中打开新的 tab、在 APP 中打开新的 webview

## 方法说明

```typescript
declare function open(url: string, options?: openWebviewOption): void | string
```

## 使用示例

```javascript
import { open } from '@crsec/tiny-utils'

// 直接跳转
open(url)

// 跳转并设置title（仅支持 APP）
open(url, { title: '页面标题' })

// 跳转并隐藏原生头部（仅支持 APP）
open(url, { hiddenTitle: true })

// 登陆后跳转（仅支持 APP）
open(url, { login: true })

// 全屏展示并隐藏底部安全区
open(url, {
  fullscreen: 1,
  hiddenbottomspace: 1,
})

// 自定义多个参数
open(url, {
  title: '自定义页面',
  fullscreen: 1,
  tzthiddentitle: 1,
  secondtype: 9,
})
```

### 密码保护

```javascript
import { open } from '@crsec/tiny-utils'
// 开启安全认证密码保护（开启后对应h5不允许截屏、录屏）
open(url, {
  tztPasswordProtection: 1,
})
```

### 右侧原生按钮

```javascript
import { open, nativeCB } from '@crsec/tiny-utils'
// 配置右侧图标-搜索
open(url, {
  secondtype: 98,
  secondtext: 'tztnavbarsearch',
  secondurl: 'http://action:10063/?',
})

// 配置右侧图标-消息
open(url, {
  secondtype: 98,
  secondtext: 'tztnavbarhelpicon',
  secondurl: encodeURIComponent(
    'http://action:10061/?secondtype=9&&fullscreen=1&&tzthiddentitle=1&&tztadjustnever=1&&tzthtopstatusBar=1&&hiddenbottomspace=1&&aTitle=&&url=%2Fdist%2Fsrc%2Fmessage-center%2Findex.html%23%2Findex%3FbgColor%3D1',
  ),
})

// 配置右侧图标-分享、帮助
open(url, {
  secondtype: 98,
  secondtext: 'tztnavbarshare', // 分享
  // secondtext: 'tztnavbarhelpicon', // 帮助
  secondjsfuncname: nativeCB(() => {
    // do something
    console.log('回调触发')
  }),
})

// 配置右侧图标-设置
open(url, {
  secondtext: 'tztnavbarset',
  secondtype: '98',
  secondurl: encodeURIComponent(
    'http://action:10061/?secondtype=9&&aTitle=&&url=%2Fdist%2Fsrc%2Fuser-info%2Findex.html%23%2Fset%3Fsource_channel%3DNewApp%26forward_page%3Dpop-up',
  ),
})
```

## 参数说明

### openWebviewOption 参数

| 参数名                  | 类型                    | 默认值      | 说明                                                                                                                     |
| ----------------------- | ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `hiddenTitle`           | `boolean`               | `false`     | 隐藏标题栏快捷配置，等同于设置全屏相关参数（等同于 fullscreen、tztadjustnever、tzthiddentitle、tzthtopstatusBar 都为 1） |
| `login`                 | `boolean`               | `false`     | 是否需要登录后再跳转                                                                                                     |
| `loginOption`           | `LoginOption`           | `undefined` | 登录相关配置参数                                                                                                         |
| `hiddenbottomspace`     | `number`                | `1`         | 是否隐藏底部空白区域。1-隐藏，0或不传-不隐藏（仅支持 iOS）                                                               |
| `tztPasswordProtection` | `number`                | `0`         | 是否开启密码保护。1-开启，0或不传-不开启（开启后对应h5不允许截屏、录屏）                                                 |
| `fullscreen`            | `TZT_FULL_SCREEN_ENUM`  | `0`         | 是否全屏展示。0-否，1-是                                                                                                 |
| `tzthiddentitle`        | `TZT_HIDDEN_TITLE_ENUM` | `0`         | 是否隐藏客户端标题。1-隐藏，0或不传-不隐藏                                                                               |
| `tzthtopstatusBar`      | `number`                | `1`         | 是否空出系统状态栏。0-预留出系统状态栏，其他-不预留                                                                      |
| `secondtype`            | `number`                | `9`         | 右侧按钮类型，详见下方 secondtype 说明                                                                                   |
| `tztadjustnever`        | `number`                | `1`         | 是否保留屏幕安全区。1-不保留，0-保留                                                                                     |
| `isExport`              | `boolean`               | -           | 是否为导出链接                                                                                                           |
| `aTitle`                | `string`                | -           | 10061使用的标题字段                                                                                                      |
| `title`                 | `string`                | -           | 页面标题（会自动转换为 aTitle）                                                                                          |

### secondtype 类型说明

| 值    | 说明                                   |
| ----- | -------------------------------------- |
| `0`   | 个股查询                               |
| `1`   | 修改字体（客户端处理）                 |
| `2`   | 订阅（后面需要带上订阅点击打开的地址） |
| `3`   | 修改（需要带上修改所要打开的地址）     |
| `4`   | 我要开户（需要带上开户地址）           |
| `5`   | 在线客服（需要带上在线客服地址）       |
| `6`   | 筛选（文字）（需要带上筛选链接地址）   |
| `7`   | 筛选1（图片）（需要带上筛选链接地址）  |
| `8`   | 快捷方式                               |
| `9`   | 右侧没有按钮                           |
| `98`  | 自定义（显示对应图片）                 |
| `99`  | 自定义（设置为默认底图，显示对应文本） |
| `100` | 右侧展示 base64 图片                   |

### 右侧原生已支持按钮说明

- tztnavbarsearch -搜索
- tztnavbarhelpicon -帮助
- tztnavbarshare -分享（APP 6.0.8 及以上）
- tztnavbarmsg -消息中心（APP 6.0.8 及以上）
- tztnavbarset -设置（APP 6.0.8 及以上）
