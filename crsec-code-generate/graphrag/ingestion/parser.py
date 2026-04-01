from __future__ import annotations

import json
import os
from html.parser import HTMLParser
from typing import List

from graphrag.common.logging import get_logger
from graphrag.common.types import Section

logger = get_logger(__name__)


def parse_markdown(path: str) -> List[Section]:
    text = _read_text(path)
    lines = text.splitlines()
    sections: List[Section] = []
    current_title = "Document"
    buffer: List[str] = []

    for line in lines:
        if line.strip().startswith("#"):
            if buffer:
                section_text = "\n".join(buffer).strip()
                if section_text:
                    sections.append(_build_section(path, current_title, section_text))
                buffer = []
            current_title = line.lstrip("#").strip() or current_title
        else:
            buffer.append(line)

    if buffer:
        section_text = "\n".join(buffer).strip()
        if section_text:
            sections.append(_build_section(path, current_title, section_text))

    logger.info("Parsed %d markdown sections from %s", len(sections), path)
    return sections


class _HtmlSectionParser(HTMLParser):
    def __init__(self, source: str) -> None:
        super().__init__()
        self._source = source
        self._sections: List[Section] = []
        self._current_title = "Document"
        self._current_text: List[str] = []
        self._heading_buffer: List[str] = []
        self._in_heading = False
        self._in_paragraph = False

    @property
    def sections(self) -> List[Section]:
        return self._sections

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in {"h1", "h2", "h3"}:
            self._flush_section()
            self._heading_buffer = []
            self._in_heading = True
        elif tag == "p":
            self._in_paragraph = True

    def handle_endtag(self, tag: str) -> None:
        if tag in {"h1", "h2", "h3"}:
            heading = "".join(self._heading_buffer).strip()
            if heading:
                self._current_title = heading
            self._in_heading = False
        elif tag == "p":
            self._in_paragraph = False
            self._current_text.append("\n\n")

    def handle_data(self, data: str) -> None:
        if self._in_heading:
            self._heading_buffer.append(data)
        elif self._in_paragraph:
            self._current_text.append(data)

    def close(self) -> None:
        super().close()
        self._flush_section()

    def _flush_section(self) -> None:
        section_text = "".join(self._current_text).strip()
        if section_text:
            self._sections.append(
                _build_section(self._source, self._current_title, section_text)
            )
        self._current_text = []


def parse_html(path: str) -> List[Section]:
    text = _read_text(path)
    parser = _HtmlSectionParser(path)
    parser.feed(text)
    parser.close()
    logger.info("Parsed %d html sections from %s", len(parser.sections), path)
    return parser.sections


def parse_api_spec(path: str) -> List[Section]:
    text = _read_text(path)
    sections: List[Section] = []
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        sections.append(_build_section(path, "API Spec", text))
        logger.info("Parsed 1 api spec section (raw) from %s", path)
        return sections

    if isinstance(data, dict) and "paths" in data and isinstance(data["paths"], dict):
        for api_path, methods in data["paths"].items():
            if not isinstance(methods, dict):
                continue
            for method, meta in methods.items():
                title = f"{str(method).upper()} {api_path}"
                body = _format_api_meta(meta)
                sections.append(_build_section(path, title, body))
    else:
        sections.append(_build_section(path, "API Spec", text))

    logger.info("Parsed %d api spec sections from %s", len(sections), path)
    return sections


def parse_text(path: str) -> List[Section]:
    text = _read_text(path)
    section = _build_section(path, "Text", text)
    logger.info("Parsed 1 text section from %s", path)
    return [section]


def _format_api_meta(meta: object) -> str:
    if not isinstance(meta, dict):
        return str(meta)
    parts: List[str] = []
    summary = meta.get("summary")
    if summary:
        parts.append(f"Summary: {summary}")
    description = meta.get("description")
    if description:
        parts.append(f"Description: {description}")
    parameters = meta.get("parameters")
    if isinstance(parameters, list):
        parts.append("Parameters:")
        for param in parameters:
            name = param.get("name") if isinstance(param, dict) else None
            desc = param.get("description") if isinstance(param, dict) else None
            if name:
                line = f"- {name}"
                if desc:
                    line += f": {desc}"
                parts.append(line)
    responses = meta.get("responses")
    if isinstance(responses, dict):
        parts.append("Responses:")
        for code, resp in responses.items():
            desc = resp.get("description") if isinstance(resp, dict) else None
            line = f"- {code}"
            if desc:
                line += f": {desc}"
            parts.append(line)
    return "\n".join(parts) if parts else json.dumps(meta)


def _build_section(path: str, title: str, text: str) -> Section:
    doc_type = _infer_doc_type(path, title, text)
    standard_level = _infer_standard_level(text)
    tags = _derive_tags(path, title)
    return Section(
        title=title,
        text=text,
        source=os.path.basename(path),
        tags=tags,
        doc_type=doc_type,
        standard_level=standard_level,
    )


def _infer_doc_type(path: str, title: str, text: str) -> str:
    path_lower = path.lower()
    title_lower = title.lower()
    text_lower = text.lower()
    if "component" in path_lower or "component" in title_lower or "ui" in path_lower:
        return "component"
    if "standard" in path_lower or "spec" in path_lower or "guideline" in text_lower:
        return "standard"
    if "faq" in path_lower or "faq" in title_lower:
        return "faq"
    if "example" in path_lower or "example" in title_lower:
        return "example"
    return "standard"


def _infer_standard_level(text: str) -> str:
    text_lower = text.lower()
    if "must" in text_lower or "required" in text_lower or "shall" in text_lower:
        return "required"
    return "recommended"


def _derive_tags(path: str, title: str) -> List[str]:
    tokens = []
    for source in (path, title):
        for token in _split_tokens(source):
            if len(token) >= 3:
                tokens.append(token)
    unique = sorted(set(tokens))
    return unique[:8]


def _split_tokens(value: str) -> List[str]:
    clean = value.replace("/", " ").replace("_", " ").replace("-", " ")
    return [token.lower() for token in clean.split() if token]


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()
