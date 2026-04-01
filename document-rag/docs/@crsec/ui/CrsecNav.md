# CrsecNav 导航栏

### 介绍

CrsecNav 是一个自定义导航栏组件，支持自定义左右按钮、标题、渐变效果等多种配置。

### 引入

```js
import Vue from "vue";
import { CrsecNav } from "@crsec/ui";

Vue.use(CrsecNav);
```

## 代码演示

### 基础用法

```html
<crsec-nav
  title="标题"
  @on-click-back="onClickBack"
  @on-click-title="onClickTitle"
  @on-click-right="onClickRight"
/>
```

```js
export default {
  methods: {
    onClickBack() {
      // 返回上一页
    },
    onClickTitle() {
      // 点击标题操作
    },
    onClickRight() {
      // 点击右侧按钮操作
    },
  },
};
```

### 使用插槽

通过插槽自定义导航栏内容。

```html
<crsec-nav title="标题">
  <template #left>
    <div>返回</div>
  </template>
  <template #right>
    <div>分享</div>
  </template>
  <template #title>
    <div>自定义标题</div>
  </template>
</crsec-nav>
```

### 设置样式

通过 `style-option` 配置导航栏样式。

```html
<crsec-nav
  :title="'设置样式'"
  style="margin-top: 20px"
  :style-option="{
        backgroundColor: '#FFCACA',
        titleColor: '#4A6FBF',
        iconColor: '#2E8B57',
      }"
/>
```

### 渐变效果

启用渐变效果使导航栏在滚动时逐渐变化。

```html
<crsec-nav
  :fixed="true"
  :gradient="true"
  title="渐变标题"
  :placeholder="true"
  :gradient-options="{
        icon: {
          startColor: '#222222',
        },
      }"
  @on-click-back="onClickBack"
  @on-click-title="onClickTitle"
  @on-click-right="onClickRight"
></crsec-nav>
```

## API

### Props

| 参数             | 说明                                               | 类型      | 默认值  |
| ---------------- | -------------------------------------------------- | --------- | ------- |
| title            | 标题文本                                           | _string_  | `''`    |
| left-show        | 是否显示左侧返回按钮                               | _boolean_ | `true`  |
| right-show       | 是否显示右侧按钮                                   | _boolean_ | `true`  |
| gradient         | 是否启用渐变效果                                   | _boolean_ | `false` |
| gradient-options | 渐变效果的配置选项                                 | _object_  | `{}`    |
| style-option     | 样式配置选项                                       | _object_  | `{}`    |
| border           | 是否显示下边框                                     | _boolean_ | `false` |
| fixed            | 是否固定在顶部                                     | _boolean_ | `false` |
| placeholder      | 固定在顶部时，是否在标签位置生成一个等高的占位元素 | _boolean_ | `false` |

### GradientOptions 渐变配置

| 参数        | 说明                                                                              | 类型     | 默认值     |
| ----------- | --------------------------------------------------------------------------------- | -------- | ---------- |
| background  | 背景渐变配置，包含 startColor、endColor、startHeight、endHeight                   | _object_ | 见下方说明 |
| icon        | 图标渐变配置，包含 startColor、endColor                                           | _object_ | 见下方说明 |
| title       | 标题渐变配置，包含 gradient、hidden、startColor、endColor、startHeight、endHeight | _object_ | 见下方说明 |
| startHeight | 整体渐变开始高度                                                                  | _number_ | `0`        |
| endHeight   | 整体渐变结束高度                                                                  | _number_ | `100`      |

渐变配置默认值：

```js
{
  icon: {
    startColor: '#ffffff',
    endColor: '#222222',
  },
  title: {
    gradient: true,
    hidden: true,
    startColor: '#ffffff',
    endColor: '#222222',
    startHeight: 0,
    endHeight: 100,
  },
  background: {
    startColor: '',
    endColor: '#ffffff',
  },
  startHeight: 0,
  endHeight: 100,
}
```

### StyleOption 样式配置

| 参数            | 说明           | 类型               | 默认值    |
| --------------- | -------------- | ------------------ | --------- |
| zIndex          | 导航栏 z-index | _number \| string_ | `1`       |
| backgroundColor | 背景颜色       | _string_           | `#ffffff` |
| titleColor      | 标题颜色       | _string_           | `#222222` |
| iconColor       | 图标颜色       | _string_           | `#222222` |

### Slots

| 名称      | 说明               |
| --------- | ------------------ |
| default   | 默认插槽，展示标题 |
| title     | 自定义标题内容     |
| left      | 自定义左侧区域内容 |
| right     | 自定义右侧区域内容 |
| back-icon | 自定义返回图标     |

### Events

| 事件名          | 说明               | 回调参数 |
| --------------- | ------------------ | -------- |
| on-click-back   | 点击左侧按钮时触发 | -        |
| on-click-title  | 点击标题时触发     | -        |
| on-click-right  | 点击右侧按钮时触发 | -        |
| on-gradient-end | 渐变效果结束时触发 | -        |
