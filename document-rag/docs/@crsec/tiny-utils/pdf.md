# pdf

支持环境：新一代APP

提供 PDF 文件预览和下载功能

## 方法说明

```typescript
/**
 * 阅读并下载PDF
 * @param pdfurl 文件url
 * @param title 文件标题
 */
export async function downloadPDF(pdfurl: string, title: string): Promise<void>

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
import { downloadPDF, openPDF } from '@crsec/tiny-utils'

// 阅读 PDF
openPDF('https://example.com/document.pdf', '文档标题')

// 阅读并下载 PDF
openPDF('https://example.com/document.pdf', '文档标题', { download: true })
// 或
downloadPDF('https://example.com/document.pdf', '文档标题')

``` 