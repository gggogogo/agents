# crOpenClientAlert 原生弹窗

::: info 版本兼容
新一代 APP：6.0.0
:::

使用请参考 [tztDialog](/utils/dialog-原生弹窗.md)

```javascript
/*
 * 参数说明：
 * title:               标题   非必须
 * message              描述    必须
 * confirmButtonText  确认按钮  必须
 * cancelButtonText   取消按钮  非必须
 */
/**
 * 返回值：
 * code:        1-成功，0-失败
 * eventId:     添加的日历id
 */
// console.log('---tztShowAlert:',aJson)
// console.log('---uuid:',TZT.uuid())

native.tztCallNative('crOpenClientAlert', aJson, TZT.uuid(), '', callBack)
```
