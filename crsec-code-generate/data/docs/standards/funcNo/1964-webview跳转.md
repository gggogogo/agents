# 10002 webview 跳转

## 功能说明

触发该功能后:
- 如果没有带 url 参数，直接关闭 webview 窗口
- 如果带了 url 参数，关闭当前 webview 并跳转到指定 url 页面
    - 如果 url 是 action 形式的，直接执行 action 功能（** 实测有问题，跳转新的 action后老的 webview 还在并且页面还被清掉了 **）
    - 否则拼 10061 打开新页面

## 接口说明

```js
T.fn.changeurl('http://action:1964')
```
