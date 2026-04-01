# CrsecKeyboard 数字键盘

### 介绍

CrsecKeyboard 是一个安全数字键盘组件，支持随机数字排列、自定义样式和输入限制，适用于需要高安全性的数字输入场景。

### 引入

在项目中引入 CrsecKeyboard：

```javascript
import { CrsecKeyboard } from "@crsec/ui";
```

## 代码演示

### 基础用法

基础数字键盘，用于输入数字内容。

```html:src/crsec-keyboard/README.md
<crsec-keyboard
  v-model="value"
  :visible.sync="showKeyboard"
  title="数字键盘"
  :maxlength="6"
/>
```

### 随机键盘

通过 `random-key-order` 属性可以随机打乱数字键顺序，提高安全性。

```html
<crsec-keyboard
  v-model="value"
  :visible.sync="showKeyboard"
  title="安全键盘"
  :random-key-order="true"
/>
```

### 小数点键盘

通过 `dot` 属性可以启用小数点键，用于输入金额等场景。

```html
<crsec-keyboard
  v-model="value"
  :visible.sync="showKeyboard"
  title="小数点键盘"
  :dot="true"
/>
```

## API

### Props

| 参数                  | 说明                                | 类型               | 默认值     |
| --------------------- | ----------------------------------- | ------------------ | ---------- |
| value                 | 键盘输入值，可使用 v-model 双向绑定 | _string_           | `''`       |
| visible               | 是否显示键盘，可使用 .sync 修饰符   | _boolean_          | `false`    |
| title                 | 键盘标题                            | _string_           | `''`       |
| maxlength             | 输入值最大长度                      | _number \| string_ | `Infinity` |
| z-index               | 键盘层级                            | _number \| string_ | `100`      |
| random-key-order      | 是否随机排序数字键                  | _boolean_          | `false`    |
| show-done-button      | 是否显示完成按钮                    | _boolean_          | `false`    |
| confirm-text          | 确认按钮文案                        | _string_           | `确认`     |
| dot                   | 是否显示小数点按键                  | _boolean_          | `false`    |
| hide-on-click-outside | 点击外部时是否隐藏键盘              | _boolean_          | `true`     |

### Events

| 事件名    | 说明               | 回调参数                                         |
| --------- | ------------------ | ------------------------------------------------ |
| input     | 输入内容变化时触发 | _value: string_                                  |
| close     | 键盘关闭时触发     | -                                                |
| blur      | 键盘失焦时触发     | -                                                |
| key-press | 点击按键时触发     | _key: { text: string, value: string \| number }_ |
| delete    | 点击删除键时触发   | -                                                |
| confirm   | 点击确认按钮时触发 | _value: string_                                  |

### Slots

| 名称     | 说明           |
| -------- | -------------- |
| 默认插槽 | 自定义键盘内容 |
