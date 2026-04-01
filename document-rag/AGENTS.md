## MCP Usage Requirements

### Internal SDK Docs (`sdk-docs`)
This repository provides the `sdk-docs` MCP server for internal `@crsec/*` libraries.

#### Mandatory Rule
Before writing, modifying, or reviewing any code related to `@crsec/*`, you must query the SDK docs first.
Do not guess component APIs, prop names, events, slots, methods, or import paths from memory.

#### Required Workflow
When working with `@crsec/*` code, follow this order:

1. Use `list_libraries()` if the target library is not fully clear.
2. Use `search_sdk_docs` with:
   - `mode: "hybrid"`
   - a precise keyword describing the component or capability
   - `library` when known, such as `@crsec/ui`
3. Use `get_doc_detail` on the matched results.
4. Implement strictly according to the documented API and examples.

#### Implementation Constraints
- Use only documented `props`, `events`, `slots`, methods, and import paths.
- Prefer documented usage examples when composing page code.
- Do not invent undocumented APIs.
- If no suitable `@crsec` component exists, prefer `vant2` before building a custom component.

---

## Design-to-Code Workflow

When the user provides a screenshot, Figma link, or design description and asks for implementation, follow this workflow strictly.

### Step 1: Analyze the Design
Extract the following from the design:
- layout structure
- section hierarchy
- component candidates
- interactions
- data fields

You should explicitly identify:
- page structure
- component list (dialog, nav, form, list, table, tabs, etc.)
- user interactions (click, expand/collapse, navigation, modal open/close, submit, etc.)
- data structure (table columns, form fields, card fields, list item fields)

### Step 2: Search Internal Component Docs First
For every identified UI element, search internal SDK docs before coding.

Suggested search patterns:
- `search_sdk_docs({ query: "dialog 弹窗", mode: "hybrid", library: "@crsec/ui" })`
- `search_sdk_docs({ query: "nav 导航", mode: "hybrid", library: "@crsec/ui" })`

Then fetch the matched docs with `get_doc_detail(...)`.

### Step 3: Implement from Documentation
Generate code only after reviewing the docs.

Rules:
- Use the documented component API only.
- Match documented examples where possible.
- Keep imports consistent with the docs.
- If the design does not match any available `@crsec` component, use `vant2`.
- Build a custom component only when neither `@crsec` nor `vant2` provides a suitable option.

---

## Component Mapping Hints

Use the following mapping as a starting point when converting design elements into component searches:

| Design Element | Candidate Component | Search Keyword |
| --- | --- | --- |
| Dialog / Modal / Confirmation Popup | `CrsecDialog` | `dialog 弹窗` |
| Top Navigation / Sidebar | `CrsecNav` | `nav 导航` |
| URL Query Handling | `query` | `query 参数` |
| Version Comparison | `semverGTE` | `semver 版本` |

Do not assume the component name is correct. If the mapping is uncertain, search `sdk-docs` first.
