# API

支持环境：新一代APP、H5、PC

基于 axios 进行的常规 http 请求

#### 使用示例

```javascript
const host = process.env.VUE_APP_RELEASE === 'sit' ? 'https://crqywxcs.crsec.com.cn' : 'https://qywx.crsec.com.cn'

const api = new API(host)

// get 请求
export function getList(params) {
  return api.get('/gapi/proxy/request', {
    funcNo: 1000088,
    params,
  })
}
// post 请求
export function getList(params) {
  return api.post('/gapi/proxy/request', {
    action: 400
    funcNo: 1000088,
    paramStr: '"{\"keyword\":\"黄金\"}"'
  })
}
```

#### 加密请求使用
需要原生加密需要控制版本，否则请求失败
支持版本：IOS、安卓 6.2.6； 鸿蒙 6.0.0 

```js
const apiWidthEncrypt = new API({
  baseUrl: host
  encrypt: true, // 加密
  tztParams: true, // 设置原生公共参数， 用户留痕
  debug: false, // 打印调试日志
  NOJSONPARSE: false, // 相应结果是否需要JSON解析输出data, 默认需要解析(false)
  headers: {
    'Content-Type': 'application/json',
    'X-Is-Encrypted': true, // 需要加密必传
  },
})
export function getList(params) {
  return api.post('/gapi/proxy/request', {
    action: 400
    funcNo: 1000088,
    paramStr: '"{\"keyword\":\"黄金\"}"'
  })
}
```
#### 加密请求使用(最佳实践)
```js
// 参数配置简化版
import { API } from '@crsec/tiny-utils'
// 接口要求的格式为
const config = {
  baseURL: process.env.VUE_APP_RELEASE === 'sit' ? 'https://crqywxcs.crsec.com.cn/gapi/proxy/request' : 'https://qywx.crsec.com.cn/gapi/proxy/request', 
}

const api = new API(config)

function queryCheckMarkstate(param) {
  return await api.query(5803, 1110030, param) // param: {keyword: '黄金'}
}
```
对接口的配置进行封装，处理了一下内容：
1、非APP或不支持加密的APP版本不加密，符号版本要求的APP内自动加密并传公共参数
2、要求的接口入参格式为：
```js
{
  action: 5800,
  funcNo: 1130015,
  paramStr: "{\"khbh\":\"10259909\",\"crToken\":\"41313d1c1d57844293e944336c78a038\"}"
}
```
3、输出结果简化只输出data
```js
{
  errorNo: 0,
  errorMsg: '成功'
  results: {isSign: true}
}
```

