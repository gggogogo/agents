# theme

支持环境：新一代APP、H5

提供主题管理功能，包括获取和设置APP主题及Web页面主题

## 方法说明

```typescript
export type TZT_SKIN_TYPE = '0' | '1' // tztskintype 获取展示的主题类型 0-黑色 1-白色
export type TZT_AUTO_SKIN = '0' | '1' // tztautoskin 获取是否智能 0-不智能 1-智能
export type SKIN_TYPE = '0' | '1' | '2' // skintype 修改主题类型 0-黑色 1-白色 2-智能

/**
 * 设置网页主题
 * @param theme 主题名称
 */
export function setWebTheme(theme: string): void

/**
 * 获取APP当前主题
 * @returns 主题类型 0-黑色 1-白色
 */
export async function getAPPTheme(): Promise<TZT_SKIN_TYPE>

/**
 * 获取网页当前主题
 * @returns 主题名称
 */
export function getWebTheme(): string

/**
 * 初始化WEB页面主题
 * 根据APP主题设置WEB页面主题
 */
export async function themeInit(): Promise<void>

/**
 * 修改APP主题设置
 * @param skintype 主题类型 0-黑色 1-白色 2-智能
 */
export async function setAPPThemeSetting(skintype: SKIN_TYPE): Promise<void>

/**
 * 获取APP主题设置
 * @returns 主题类型 0-黑色 1-白色 2-智能
 */
export async function getAPPThemeSetting(): Promise<SKIN_TYPE>
```

## 使用示例

```javascript
import { getAPPTheme } from '@crsec/tiny-utils'

// 初始化页面主题
themeInit()

// 获取APP当前主题
const theme = await getAPPTheme() //0-黑色 1-白色
```
