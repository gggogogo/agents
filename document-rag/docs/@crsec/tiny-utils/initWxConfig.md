# wxShare

支持环境：微信环境

提供微信 JSSDK 分享功能的初始化与配置，适用于微信二次分享场景

## 方法说明

```typescript
export interface WxShareInfo {
  title: string
  desc: string
  link?: string
  imgUrl?: string
  success?: (res: any) => void
  fail?: (err: any) => void
  complete?: (e: any) => void
}

export function initWxConfig(shareInfo: WxShareInfo): void
```

## 使用示例

```javascript
import { initWxConfig } from '@crsec/tiny-utils'

// 初始化微信分享
initWxConfig({
  title: '分享标题',
  desc: '分享描述文本',
})
```
