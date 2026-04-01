# CrsecSwitch 开关

用于在打开和关闭状态之间进行切换。参考 Vant2 Switch 组件设计，支持 Vue2 和 Option API。

## 引入

```js
import { CrsecSwitch } from "@crsec/ui";

export default {
  components: {
    CrsecSwitch,
  },
};
```

## 代码演示

### 基础用法

通过 `v-model` 绑定开关的选中状态，`true` 表示开，`false` 表示关。

```html
<template>
  <crsec-switch v-model="checked" />
</template>

<script>
  export default {
    data() {
      return {
        checked: true,
      };
    },
  };
</script>
```

### 禁用状态

通过 `disabled` 属性来禁用开关，禁用状态下开关不可点击。

```html
<template>
  <crsec-switch v-model="checked" disabled />
</template>
```

### 加载状态

通过 `loading` 属性设置开关为加载状态，加载状态下开关不可点击。

```html
<template>
  <crsec-switch v-model="checked" loading />
</template>
```

### 自定义大小

通过 `size` 属性自定义开关的大小。

```html
<template>
  <crsec-switch v-model="checked" size="24px" />
</template>
```

### 自定义颜色

`active-color` 属性表示打开时的背景色，`inactive-color` 表示关闭时的背景色。

```html
<template>
  <crsec-switch
    v-model="checked"
    active-color="#ee0a24"
    inactive-color="#dcdee0"
  />
</template>
```

### 自定义值

通过 `active-value` 和 `inactive-value` 属性来自定义开关的值，支持 `v-model` 双向绑定任意类型的数据。

```html
<template>
  <!-- 数字值 -->
  <crsec-switch v-model="status" :active-value="1" :inactive-value="0" />

  <!-- 字符串值 -->
  <crsec-switch v-model="mode" active-value="on" inactive-value="off" />

  <!-- 对象值 -->
  <crsec-switch
    v-model="config"
    :active-value="{ status: 'enabled', level: 1 }"
    :inactive-value="{ status: 'disabled', level: 0 }"
  />

  <!-- 数组值 -->
  <crsec-switch
    v-model="permissions"
    :active-value="['read', 'write']"
    :inactive-value="['read']"
  />
</template>

<script>
  export default {
    data() {
      return {
        status: 1,
        mode: "off",
        config: { status: "disabled", level: 0 },
        permissions: ["read"],
      };
    },
  };
</script>
```

### 异步控制

需要异步控制开关时，可以使用 `loading` 属性。

```html
<template>
  <crsec-switch v-model="checked" :loading="loading" @change="onAsyncChange" />
</template>

<script>
  export default {
    data() {
      return {
        checked: false,
        loading: false,
      };
    },
    methods: {
      onAsyncChange(value) {
        this.loading = true;
        // 模拟异步操作
        setTimeout(() => {
          this.loading = false;
          console.log("开关状态已变更为:", value);
        }, 2000);
      },
    },
  };
</script>
```

## API

### Props

| 参数            | 说明                    | 类型               | 默认值                     |
| --------------- | ----------------------- | ------------------ | -------------------------- |
| value (v-model) | 开关选中状态            | _any_              | `false`                    |
| loading         | 是否为加载状态          | _boolean_          | `false`                    |
| disabled        | 是否为禁用状态          | _boolean_          | `false`                    |
| size            | 开关尺寸，默认单位为 px | _number \| string_ | `22px`                     |
| active-color    | 打开时的背景色          | _string_           | `var(--color-secondary-2)` |
| inactive-color  | 关闭时的背景色          | _string_           | `var(--color-text-4)`      |
| active-value    | 打开时对应的值          | _any_              | `true`                     |
| inactive-value  | 关闭时对应的值          | _any_              | `false`                    |

### Events

| 事件名 | 说明               | 回调参数       |
| ------ | ------------------ | -------------- |
| change | 开关状态切换时触发 | _value: any_   |
| click  | 点击时触发         | _event: Event_ |

### 样式变量

组件提供了下列 Less 变量，可用于自定义样式：

| 名称                          | 默认值                             | 描述           |
| ----------------------------- | ---------------------------------- | -------------- |
| @switch-size                  | 30px                               | 开关大小       |
| @switch-width                 | 2em                                | 开关宽度       |
| @switch-height                | 1em                                | 开关高度       |
| @switch-node-size             | 1em                                | 节点大小       |
| @switch-node-background-color | #ffffff                            | 节点背景色     |
| @switch-node-box-shadow       | 0 3px 1px 0 rgba(0, 0, 0, 0.05)... | 节点阴影       |
| @switch-background-color      | #ffffff                            | 背景色         |
| @switch-on-background-color   | #1989fa                            | 开启状态背景色 |
| @switch-transition-duration   | 0.3s                               | 动画时长       |
| @switch-disabled-opacity      | 0.5                                | 禁用状态透明度 |
| @switch-border                | 1px solid rgba(0, 0, 0, 0.1)       | 边框样式       |

## 设计理念

### 交互设计

- **直观的视觉反馈**：通过颜色变化和滑块动画，清晰地传达开关状态
- **流畅的动画效果**：使用缓动函数，让状态切换更加自然
- **明确的状态指示**：支持加载状态，避免用户重复操作

### 无障碍访问

- 明确的颜色对比度，确保视觉清晰
- 支持键盘操作（计划支持）
- 语义化的 HTML 结构

### 移动端优化

- 扩大触摸区域，提升触摸体验
- 响应式设计，适配不同屏幕尺寸
- 流畅的动画性能，避免卡顿

## 兼容性

- Vue 2.x
- 现代浏览器
- iOS Safari 9+
- Android Chrome 50+

## 更新日志

### v1.0.0

- 🎉 初始版本发布
- ✨ 支持基础开关功能
- ✨ 支持自定义颜色、大小、值
- ✨ 支持禁用和加载状态
- ✨ 提供完整的事件系统
- 🎨 移动端优化设计
- 🧪 完整的单元测试

## 参与贡献

欢迎提交 Issue 和 Pull Request 来改进这个组件！

## 开源协议

本项目基于 MIT 协议开源。
