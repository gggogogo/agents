# CrsecDropDwon 下拉菜单组件

### 介绍

CrsecDropDwon是一个下拉菜单选择组件，支持单选

### 引入

```js
import Vue from "vue";
import { CrsecDropDwon } from "@crsec/ui";

Vue.use(CrsecDropDwon);
```

## 代码演示

### 基础用法

```html
<crsec-drop-down
  v-model="curOpt"
  :options="options"
  @select="select"
></crsec-drop-down>
```

## API

### Props

| 参数                | 说明                     | 类型      | 默认值                             |
| ------------------- | ------------------------ | --------- | ---------------------------------- |
| options             | 菜单选项数据组           | _Array_   | `[text：${text}, value: ${value}]` |
| activeIcon          | 选中项目的图标           | _string_  | `''`                               |
| maxHeight           | 下拉菜单最大高度         | _string_  | `350px`                            |
| defaultTitle        | 默认菜单名称             | _string_  | `''`                               |
| position            | 弹窗位置                 | _string_  | `'bottom'`                         |
| iconColor           | 菜单栏下拉图标未选中颜色 | _string_  | `#999`                             |
| closeOnClickOverlay | 点击遮罩层是否关闭       | _boolean_ | `true`                             |
| duration            | 下拉动画时长             | _number_  | `0.3s`                             |

### Events

| 事件名      | 说明             | 回调参数               |
| ----------- | ---------------- | ---------------------- |
| change      | 选择菜单选项触发 | _value_ 选择项目       |
| pickerClick | 点击下拉时触发   | _value_ 是否展示下拉框 |

### Slots

| 名称      | 说明                                              |
| --------- | ------------------------------------------------- |
| rightIcon | 自定义菜单下拉按钮, 作用域`showPanel`是否展示下拉 |
