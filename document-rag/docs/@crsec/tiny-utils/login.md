# login

支持环境：新一代APP

唤起登录，如果需要登录后跳转某一页面可直接使用 [**open**](/utils/open) 方法

## 方法说明

```typescript
export enum TZT_LOGIN_TYPE {
  // 系统登录
  SYSTEM = 0,
  // 交易登录
  TRADE = 1,
  // 融资融券登录
  MARGIN = 2,
  // 个股期权登录
  STOCK_OPTION = 8,
  // 担保品划转普通登录
  COLLATERAL_TRANSFER = 9,
}

export enum TZT_LOGIN_KIND {
  WEAK = 0,
  STRONG = 1,
  ADD_ACCOUNT = 2,
}

// 是否员工校验，1 不做员工校验，0 做员工校验
export enum IS_NEED_STAFF_INFO {
  YES = 0,
  NO = 1,
}

export interface LoginOption {
  jsfuncname?: string
  url?: string
  logintype?: number // 登录类型，0-系统登录 1-交易登录 2-融资融券登录 8-个股期权登录 9-担保品划转普通登录
  loginkind?: number // 当logintype＝1时，判断登录方式，0-弱权限登录(通讯密码登录）1-强权限登录(交易密码登录) 2－添加账号
  isExport?: boolean // 是否导出,默认false,true时只返回 url 不执行动作
  isneedstaffinfo?: IS_NEED_STAFF_INFO // 是否校验员工信息
}

/**
 * 调用 APP 登录
 * @param callback 登录成功回调函数
 * @param option 登录选项
 * @returns 导出时返回 URL，否则返回 void
 */
export function login(callback?: () => void, option?: LoginOption): void | string

/**
 * 检查是否已登录
 * @returns 是否已登录
 */
export async function isLogin(): Promise<boolean>
```

## 使用示例

```javascript
import { login, isLogin, TZT_LOGIN_TYPE, TZT_LOGIN_KIND } from '@crsec/tiny-utils'

// 调用登录并设置回调
login(() => {
  console.log('登录成功')
})

// 使用交易登录
login(() => {
  console.log('交易登录成功')
}, {
  logintype: TZT_LOGIN_TYPE.TRADE,
  loginkind: TZT_LOGIN_KIND.STRONG
})

// 检查是否已登录
async function checkLoginStatus() {
  const loggedIn = await isLogin()
  if (loggedIn) {
    console.log('用户已登录')
  } else {
    console.log('用户未登录')
    login()
  }
}
```