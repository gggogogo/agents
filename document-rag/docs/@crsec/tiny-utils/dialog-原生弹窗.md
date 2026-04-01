# tztDialog 原生弹窗

支持环境：新一代APP

展示原生弹窗，支持标题、描述、确认按钮、取消按钮等配置。

## 方法说明

```typescript
declare function tztDialog(option: DialogOption, callback: CBFunc): void

export interface DialogOption {
  title?: string // 标题
  message: string // 内容
  confirmButtonText: string // 确认按钮文本
  cancelButtonText?: string // 取消按钮文本
}

export type CBFunc = (res: 'confirm' | 'cancel') => void
```

## 使用示例

```javascript
import { tztDialog } from '@crsec/tiny-utils'

// 基本用法 - 只有确认按钮
tztDialog(
  {
    message: '这是一个提示信息',
    confirmButtonText: '确定',
  },
  (res) => {
    if (res === 'confirm') {
      console.log('用户点击了确认')
    }
  }
)

// 带标题的弹窗
tztDialog(
  {
    title: '温馨提示',
    message: '是否确认执行此操作？',
    confirmButtonText: '确认',
  },
  (res) => {
    if (res === 'confirm') {
      console.log('用户确认了操作')
    }
  }
)

// 带确认和取消按钮的弹窗
tztDialog(
  {
    title: '删除确认',
    message: '此操作不可恢复，是否确认删除？',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  },
  (res) => {
    if (res === 'confirm') {
      console.log('用户确认删除')
      // 执行删除操作
    } else if (res === 'cancel') {
      console.log('用户取消了删除')
    }
  }
)

// 自定义按钮文本
tztDialog(
  {
    title: '网络异常',
    message: '网络连接失败，请检查网络设置后重试',
    confirmButtonText: '重试',
    cancelButtonText: '稍后再试',
  },
  (res) => {
    if (res === 'confirm') {
      // 重新发起请求
      console.log('重新发起网络请求')
    } else {
      console.log('用户选择稍后重试')
    }
  }
)
```

## 参数说明

### DialogOption 参数

| 参数名              | 类型     | 是否必填 | 默认值 | 说明                             |
| ------------------- | -------- | -------- | ------ | -------------------------------- |
| `title`             | `string` | 否       | -      | 弹窗标题，不传则不显示标题       |
| `message`           | `string` | 是       | -      | 弹窗内容文本                     |
| `confirmButtonText` | `string` | 是       | -      | 确认按钮的文本                   |
| `cancelButtonText`  | `string` | 否       | -      | 取消按钮的文本，不传则只显示确认按钮 |

### CBFunc 回调函数

回调函数接收一个参数 `res`，类型为 `'confirm' | 'cancel'`：

- `'confirm'`：用户点击了确认按钮
- `'cancel'`：用户点击了取消按钮

## 注意事项

1. **环境限制**：此方法仅在新一代APP中可用，在浏览器环境中会输出警告信息并直接返回
2. **依赖检查**：需要确保 `window.native.tztCallNative` 方法存在，否则会输出警告信息
3. **按钮配置**：如果只传 `confirmButtonText` 而不传 `cancelButtonText`，弹窗将只显示一个确认按钮
4. **回调处理**：建议在回调函数中根据 `res` 参数值进行不同的业务处理
