# Dialog 对话框

### 介绍

基于 Vant2 Dialog 组件的二次封装，提供更加统一的样式风格和移动端优化体验。
<br/>
已适配暗黑版规范和移动端响应式设计。

### 引入

```js
import { CrsecDialog } from "@crsec/ui";
```

## 代码演示

### 基础用法

通过 `v-model` 控制对话框的显示与隐藏。

```html
<crsec-dialog v-model="show" title="标题" show-cancel-button>
  <p>弹窗内容</p>
</crsec-dialog>
```

### 自定义样式

可以通过 `custom-class` 属性添加自定义样式类名。

```html
<crsec-dialog
  v-model="show"
  title="自定义对话框"
  custom-class="my-dialog"
  show-cancel-button
>
  <p>这是一个自定义样式的对话框</p>
</crsec-dialog>
```

### 插槽使用

支持自定义标题、内容和底部区域。

```html
<crsec-dialog v-model="show">
  <template #title>
    <span class="custom-title">自定义标题</span>
  </template>

  <div class="custom-content">
    <p>自定义内容区域</p>
  </div>

  <template #footer>
    <van-button type="primary" @click="confirm">确认</van-button>
    <van-button @click="cancel">取消</van-button>
  </template>
</crsec-dialog>
```

### 函数式调用

除了组件调用方式，CrsecDialog 还支持函数式调用，提供更加便捷的使用方式。

#### Alert 提示

```javascript
// 基础用法
CrsecDialog.alert({
  message: "提示内容",
}).then(() => {
  // 点击确认后的回调
});

// 带配置的用法
CrsecDialog.alert({
  title: "提示",
  message: "这是提示内容",
  confirmButtonText: "知道了",
}).then(() => {
  console.log("确认");
});
```

#### Confirm 确认

```javascript
// 基础用法
CrsecDialog.confirm("确认要执行这个操作吗？")
  .then(() => {
    console.log("用户点击了确认");
  })
  .catch(() => {
    console.log("用户点击了取消");
  });

// 带配置的用法
CrsecDialog.confirm({
  title: "删除确认",
  message: "确认要删除这条记录吗？",
  confirmButtonText: "删除",
  cancelButtonText: "取消",
})
  .then(() => {
    console.log("确认删除");
  })
  .catch(() => {
    console.log("取消删除");
  });
```

#### 全局配置

```javascript
// 设置默认配置
CrsecDialog.setDefaultOptions({
  confirmButtonText: "OK",
  cancelButtonText: "Cancel",
});

// 重置默认配置
CrsecDialog.resetDefaultOptions();
```

#### 在 Vue 实例中使用

安装插件后，可以通过 `this.$crsecDialog` 使用：

```javascript
// 在 main.js 中安装
import CrsecDialog from "@/components/crsec-dialog";
Vue.use(CrsecDialog);

// 在组件中使用
export default {
  methods: {
    showAlert() {
      this.$crsecDialog.alert("提示内容");
    },
    showConfirm() {
      this.$crsecDialog
        .confirm("确认内容")
        .then(() => {
          // 确认回调
        })
        .catch(() => {
          // 取消回调
        });
    },
  },
};
```

## API

### Props

| 参数         | 说明           | 类型     | 默认值 |
| ------------ | -------------- | -------- | ------ |
| custom-class | 自定义样式类名 | _string_ | -      |

### 继承属性

除了上述 Props，CrsecDialog 完全继承 Vant Dialog 组件的所有属性：

| 参数                   | 说明                       | 类型               | 默认值  |
| ---------------------- | -------------------------- | ------------------ | ------- |
| v-model                | 是否显示弹窗               | _boolean_          | -       |
| title                  | 标题                       | _string_           | -       |
| width                  | 弹窗宽度，默认单位为px     | _number \| string_ | `320px` |
| message                | 文本内容，支持通过`\n`换行 | _string_           | -       |
| show-cancel-button     | 是否显示取消按钮           | _boolean_          | `false` |
| show-confirm-button    | 是否显示确认按钮           | _boolean_          | `true`  |
| cancel-button-text     | 取消按钮文案               | _string_           | `取消`  |
| confirm-button-text    | 确认按钮文案               | _string_           | `确认`  |
| overlay                | 是否显示遮罩层             | _boolean_          | `true`  |
| overlay-class          | 自定义遮罩层类名           | _string_           | -       |
| overlay-style          | 自定义遮罩层样式           | _object_           | -       |
| close-on-popstate      | 是否在页面回退时自动关闭   | _boolean_          | `true`  |
| close-on-click-overlay | 是否在点击遮罩层后关闭     | _boolean_          | `false` |

### Events

继承 Vant Dialog 组件的所有事件：

| 事件名  | 说明                     | 回调参数 |
| ------- | ------------------------ | -------- |
| confirm | 点击确认按钮时触发       | -        |
| cancel  | 点击取消按钮时触发       | -        |
| open    | 打开弹窗时触发           | -        |
| close   | 关闭弹窗时触发           | -        |
| opened  | 打开弹窗且动画结束后触发 | -        |
| closed  | 关闭弹窗且动画结束后触发 | -        |

### Slots

| 名称    | 说明               |
| ------- | ------------------ |
| default | 自定义内容         |
| title   | 自定义标题         |
| footer  | 自定义底部按钮区域 |

## 函数式调用 API

### 方法

| 方法名                          | 说明           | 参数                 | 返回值    |
| ------------------------------- | -------------- | -------------------- | --------- |
| CrsecDialog.alert               | 展示提示对话框 | `options \| message` | `Promise` |
| CrsecDialog.confirm             | 展示确认对话框 | `options \| message` | `Promise` |
| CrsecDialog.close               | 关闭当前对话框 | -                    | -         |
| CrsecDialog.setDefaultOptions   | 设置默认配置   | `options`            | -         |
| CrsecDialog.resetDefaultOptions | 重置默认配置   | -                    | -         |

### Options

| 参数                | 说明               | 类型      | 默认值                             |
| ------------------- | ------------------ | --------- | ---------------------------------- |
| title               | 标题               | _string_  | -                                  |
| message             | 内容               | _string_  | -                                  |
| confirmButtonText   | 确认按钮文字       | _string_  | `确认`                             |
| cancelButtonText    | 取消按钮文字       | _string_  | `取消`                             |
| showCancelButton    | 是否显示取消按钮   | _boolean_ | `false` (alert) / `true` (confirm) |
| closeOnClickOverlay | 点击遮罩层是否关闭 | _boolean_ | `false`                            |
| overlay             | 是否显示遮罩层     | _boolean_ | `true`                             |
| lockScroll          | 是否锁定背景滚动   | _boolean_ | `true`                             |

### 样式定制

组件提供以下 CSS 变量用于样式定制：

```less
.crsec-dialog {
  // 标题样式
  .van-dialog__header {
    padding: 20px 20px 12px;
    font-size: 16px;
    font-weight: 600;
  }

  // 内容样式
  .van-dialog__content {
    padding: 12px 20px 20px;
    font-size: 14px;
    line-height: 20px;
  }

  // 按钮样式
  .van-dialog__footer {
    .van-button {
      border-radius: 6px;
      font-weight: 500;
    }
  }
}
```
