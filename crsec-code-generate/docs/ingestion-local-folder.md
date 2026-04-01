# 本地目录入库规范（给开发人员）

> 目标：提供一套可落地的“本地文件夹 → 解析 → 入库”的标准流程，便于开发实现。

---

## 1. 约定目录
将需要解析的文档放在固定目录，例如：

```
/Users/guowei/Documents/project/agent/crsec-code-generate/data/docs
```

建议结构（可选）：
```
crsec-code-generate/
  data/
    docs/
      standards/
      components/
      examples/
      faq/
```

---

## 2. 支持的文件类型
一期建议支持：
- `.md`
- `.html`
- `.txt`

> PDF/Docx 二期再做（需要引入额外解析器）。

---

## 3. 文件命名与内容规范
- 文件名包含主题关键词（便于 source 追溯）
- 规范文档建议在标题或段落中出现 “强制/推荐” 字样
- 组件文档应包含组件名与用途说明

---

## 4. 入库流程（开发必须实现）

### 4.1 遍历目录
- 递归扫描 `data/docs` 目录
- 按后缀选择解析器

### 4.2 解析规则
- `.md` → `parse_markdown`
- `.html` → `parse_html`
- `.txt` → `parse_text`（新增简单解析器）

输出 `Section` 列表：
```ts
Section{ title, text, source, tags, doc_type, standard_level }
```

### 4.3 分块与写入
- `chunk_sections` (min=200, max=1200)
- `embed_chunks`
- `upsert_qdrant`
- 如存在组件/依赖映射清单，写入 Neo4j

---

## 5. 文档分类规则（doc_type）
推荐通过目录或文件名判断：

| 目录/文件名包含 | doc_type |
| --- | --- |
| standards | standard |
| components | component |
| examples | example |
| faq | faq |

默认：`standard`

---

## 6. 标准级别（standard_level）
推荐解析规则：
- 文档内容含 “强制/必须/禁止” → `required`
- 文档内容含 “推荐/建议/最佳实践” → `recommended`
- 无法判断 → `recommended`

---

## 7. CLI 示例（开发参考）
预期提供脚本入口（示例）：
```
python -m graphrag.scripts.ingest_local_docs   --path /Users/guowei/Documents/project/agent/crsec-code-generate/data/docs
```

---

## 8. 验收标准
- 目录下所有支持格式文件被解析
- 入库后 `retrieve_standards` 能命中对应内容
- `source` 字段保留相对路径信息

---

## 9. 备注
- 一期 Shared-only：不允许写入任何个人习惯数据
- 解析失败时要记录日志（英文）
