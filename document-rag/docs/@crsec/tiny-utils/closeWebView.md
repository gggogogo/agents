# closeWebView

支持环境：新一代APP

关闭当前 WebView 窗口，在浏览器环境下尝试关闭当前标签页

## 方法说明

```typescript
export function closeWebView(): void
```

## 使用示例

```javascript
import { closeWebView } from '@crsec/tiny-utils'

// 关闭当前 WebView 或浏览器标签页
closeWebView()

// 在按钮点击事件中使用
function handleClose() {
  closeWebView()
}
