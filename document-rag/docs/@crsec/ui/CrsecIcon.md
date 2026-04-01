# CrsecIcon 图标

### 介绍

基于字体的图标集，可以通过 CrsecIcon 组件使用，也可以在其他组件中通过 `icon` 属性引用。
<br/>
已适配暗黑版规范。

### 引入

```js
import { CrsecIcon } from "@crsec/ui";
```

## 代码演示

### 基础用法

`Icon` 的 `name` 属性支持传入图标名称，所有可用的图标名称见右侧示例。

```html
<crsec-icon name="install" />
```

### 图标颜色

`Icon` 的 `color` 属性用来设置图标的颜色。

```html
<crsec-icon name="edit" color="#1989fa" />
<crsec-icon name="close" color="#ee0a24" />
```

### 图标大小

`Icon` 的 `size` 属性用来设置图标的尺寸大小，默认单位为 `px`。

```html
<crsec-icon name="chat-o" size="40" />

<crsec-icon name="chat-o" size="3rem" />
```

## API

### Props

| 参数  | 说明                                      | 类型               | 默认值    |
| ----- | ----------------------------------------- | ------------------ | --------- |
| name  | 图标名称或图片链接                        | _string_           | -         |
| color | 图标颜色                                  | _string_           | `inherit` |
| size  | 图标大小，如 `20px` `2em`，默认单位为`px` | _number \| string_ | `inherit` |

### Events

| 事件名 | 说明           | 回调参数       |
| ------ | -------------- | -------------- |
| click  | 点击图标时触发 | _event: Event_ |
