# 10002 点击WebView返回

## 功能说明

等效于点击 webview 的返回按钮，触发该功能后:
- window.history.back() 会被调用
- 如果 webview 无法后退，则会关闭当前 webview 窗口

## 接口说明

```js
T.fn.changeurl('http://action:10002')
```
