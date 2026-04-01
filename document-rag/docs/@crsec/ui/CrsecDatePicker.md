# CrsecDatePicker 日期选择器

## 介绍

CrsecDatePicker 是一个功能丰富的日期选择器组件，支持快捷时间选择、自定义时间范围选择、多种弹窗位置和灵活的插槽自定义。

## 引入

```js
import Vue from "vue";
import { CrsecDatePicker } from "@crsec/ui";

Vue.use(CrsecDatePicker);
```

## 代码演示

### 基础用法

最简单的使用方式，选择日期范围：

```html
<template>
  <crsec-date-picker
    ref="date-filter"
    position="top"
    :min="min"
    :max="max"
    :day-limit="720"
    :bgn-date.sync="bgnDate"
    :end-date.sync="endDate"
    @change="onConfirmDate"
    @pickerClick="pickerClick"
  />
</template>

<script>
  import { formatDate, addDays } from "@crsec/ui";

  export default {
    data() {
      return {
        bgnDate: "2025-05-07",
        endDate: "2025-09-07",
        max: "2025-09-07",
        min: "2004-12-01",
      };
    },
    methods: {
      onConfirmDate(date) {
        console.log("选择的日期:", date);
      },
      pickerClick(currentShow) {
        console.log("弹窗状态:", currentShow);
      },
    },
  };
</script>
```

### 自定义下拉菜单

使用 `menuBar` 插槽自定义菜单栏显示：

```html
<template>
  <crsec-date-picker
    ref="date-filter"
    position="top"
    :min="min"
    :max="max"
    :minday-limit="30"
    minday-limit-tip="查询报告时间不能小于30天"
    :bgn-date.sync="bgnDate"
    :end-date.sync="endDate"
    @change="onConfirmDate"
    @pickerClick="pickerClick"
  >
    <template #menuBar="{ beginDate: bgnDate1, endDate: endDate1 }">
      <div class="custom-menu-bar">
        <div>自定义下拉菜单</div>
        <div>{{ bgnDate1 }}~{{ endDate1 }}</div>
      </div>
    </template>
  </crsec-date-picker>
</template>

<style>
  .custom-menu-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
```

### 快捷时间选择

启用快捷时间面板，提供预设的时间选项：

```html
<template>
  <crsec-date-picker
    id="quick-panel"
    ref="date-filter"
    position="top"
    :min="min"
    :max="max"
    :show-quick-panel="true"
    :bgn-date.sync="bgnDate"
    :end-date.sync="endDate"
    :quick-panel-options="quickPanelOptions"
    @change="onConfirmDate"
    @pickerClick="pickerClick"
  />
</template>

<script>
  export default {
    data() {
      return {
        quickPanelOptions: [
          {
            text: "近几天",
            value: 0,
            dates: "2025-05-07~2025-05-08",
          },
          {
            text: "自定义日期",
            value: 1,
            dates: "2025-05-01~2025-05-08",
          },
        ],
      };
    },
  };
</script>
```

### 底部弹窗

设置弹窗位置为底部：

```html
<template>
  <crsec-date-picker
    id="quick-panel"
    ref="date-filter"
    :title="'选择日期'"
    :min="min"
    :max="max"
    :show-quick-panel="true"
    :bgn-date.sync="bgnDate"
    :end-date.sync="endDate"
    :quick-panel-options="quickPanelOptions"
    @change="onConfirmDate"
    @pickerClick="pickerClick"
  />
</template>
```

### 默认描述文本

显示默认的描述文本：

```html
<template>
  <crsec-date-picker
    id="quick-panel"
    ref="date-filter"
    position="top"
    default-desc="全部日期"
    :min="min"
    :max="max"
    :bgn-date.sync="bgnDate"
    :end-date.sync="endDate"
    @change="onConfirmDate"
    @pickerClick="pickerClick"
  />
</template>
```

### 自定义图标

使用 `rightIcon` 插槽自定义下拉图标：

```html
<template>
  <crsec-date-picker
    :bgn-date.sync="bgnDate"
    :end-date.sync="endDate"
    @change="onConfirmDate"
  >
    <template #rightIcon="{ showPanel }">
      <i :class="['custom-icon', showPanel ? 'icon-up' : 'icon-down']"></i>
    </template>
  </crsec-date-picker>
</template>

<style>
  .custom-icon {
    font-size: 12px;
    color: #666;
    transition: transform 0.3s;
  }

  .icon-up {
    transform: rotate(180deg);
  }
</style>
```

## API

### Props

| 参数                | 说明                     | 类型      | 默认值     |
| ------------------- | ------------------------ | --------- | ---------- |
| defaultDesc         | 默认菜单文本             | _string_  | `''`       |
| showQuickPanel      | 是否显示快捷时间选择     | _boolean_ | `false`    |
| quickPanelOptions   | 自定义快捷时间选项       | _Array_   | `[]`       |
| bgnDate             | 开始日期                 | _string_  | `近一月前` |
| endDate             | 结束日期                 | _string_  | `当前日期` |
| serverTime          | 默认自然日时间           | _string_  | `当前日期` |
| position            | 弹窗位置                 | _string_  | `'bottom'` |
| title               | 弹窗标题                 | _string_  | `''`       |
| iconColor           | 菜单栏下拉图标未选中颜色 | _string_  | `#999999`  |
| closeOnClickOverlay | 点击遮罩层是否关闭       | _boolean_ | `true`     |
| duration            | 下拉动画时长             | _number_  | `0.3`      |

### Events

| 事件名         | 说明               | 回调参数                                                      |
| -------------- | ------------------ | ------------------------------------------------------------- |
| pickerClick    | 点击下拉触发       | _boolean_                                                     |
| change         | 日期选择确认时触发 | _{ startValue: string, endValue: string, quickDate: string }_ |
| reset          | 重置时触发         | -                                                             |
| update:bgnDate | 更新开始日期时触发 | _string_                                                      |
| update:endDate | 更新结束日期时触发 | _string_                                                      |

### Slots

| 名称           | 说明           | 参数                                                         |
| -------------- | -------------- | ------------------------------------------------------------ |
| menuBar        | 自定义菜单栏   | `{ beginDate: string, endDate: string, showPanel: boolean }` |
| rightIcon      | 自定义下拉图标 | `{ showPanel: boolean }`                                     |
| customDateDesc | 自定义时间描述 | -                                                            |

### 快捷时间选项格式

```javascript
const quickPanelOptions = [
  {
    text: "近几天", // 显示文本
    value: 0, // 选项值
    dates: "2025-05-07~2025-05-08", // 对应的日期范围
  },
];
```

## 注意事项

1. **日期格式**：组件使用 `YYYY-MM-DD` 格式的日期字符串
2. **快捷选项**：`quickPanelOptions` 中的 `dates` 格式必须为 `YYYY-MM-DD~YYYY-MM-DD`
3. **插槽使用**：使用作用域插槽时，参数名会自动从 kebab-case 转换为 camelCase
4. **默认时间**：`bgnDate` 默认为近一月前，`endDate` 默认为当前日期
