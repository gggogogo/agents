# openPDF

支持环境：新一代APP

阅读 PDF 文件，支持选择是否下载

## 方法说明

```typescript
/**
 * 阅读PDF
 * @param pdfurl 文件url
 * @param title 文件标题
 * @param options 选项
 */
export function openPDF(
  pdfurl: string,
  title: string,
  options?:
    | {
        download?: boolean
      }
): void
```

## 使用示例

```javascript
import { openPDF } from '@crsec/tiny-utils'

// 阅读 PDF
openPDF('https://example.com/document.pdf', '文档标题')

// 阅读并下载 PDF
openPDF('https://example.com/document.pdf', '文档标题', { download: true })
``` 