# autoFontSize
支持环境：新一代APP、H5、PC

自适应字体大小



## 使用示例

```javascript
## main.js
import { autoFontSize } from '@crsec/tiny-utils'
const autoResizeManager = new AutoResizeManager()
const handleAutoResize = (el, value) => {
  if (typeof value === 'object') {
    const { setFontSize, minFontSize } = value
    autoResizeManager.updateTextFont(el, setFontSize, minFontSize)
  } else {
    autoResizeManager.updateTextFont(el, value)
  }
}

Vue.directive('auto-resize', {
  componentUpdated(el, { value }) {
    handleAutoResize(el, value)
  },
  inserted(el, { value }) {
    handleAutoResize(el, value)
  },
  unbind() {
    autoResizeManager.unbind()
  },
})

```
```html
## index.vue
<div class="num" v-resize="isOldVersion ? 18 : 14"></div>
<!-- 默认14px -->
<div class="num" v-resize></div> 
```
```css
## css
.num {
    width: 100px;
}
```

### 注意事项
默认：
1、数字的font-family为`tztNum`, 其他为系统默认
2、设计稿为`375px`
