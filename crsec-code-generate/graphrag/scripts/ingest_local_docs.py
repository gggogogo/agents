import argparse
import asyncio
import json
import os
from typing import Iterable, List

from graphrag.common.logging import get_logger
from graphrag.common.types import Section
from graphrag.ingestion.chunker import chunk_sections
from graphrag.ingestion.embedder import embed_chunks
from graphrag.ingestion.parser import parse_api_spec, parse_html, parse_markdown, parse_text
from graphrag.ingestion.writer import (
    upsert_components,
    upsert_dependencies,
    upsert_qdrant,
    upsert_standards,
)

logger = get_logger(__name__)

_SUPPORTED_EXT = {
    ".md": parse_markdown,
    ".html": parse_html,
    ".txt": parse_text,
}

_REQUIRED_KEYWORDS = ["强制", "必须", "禁止"]
_RECOMMENDED_KEYWORDS = ["推荐", "建议", "最佳实践"]


def _infer_doc_type(path_rel: str) -> str:
    lower = path_rel.lower()
    if "standards" in lower:
        return "standard"
    if "components" in lower:
        return "component"
    if "examples" in lower:
        return "example"
    if "faq" in lower:
        return "faq"
    return "standard"


def _infer_standard_level(text: str) -> str | None:
    for keyword in _REQUIRED_KEYWORDS:
        if keyword in text:
            return "required"
    for keyword in _RECOMMENDED_KEYWORDS:
        if keyword in text:
            return "recommended"
    return None


def _normalize_source(path_rel: str) -> str:
    return path_rel.replace(os.sep, "/")


def _load_sections(path_root: str) -> List[Section]:
    sections: List[Section] = []
    for dirpath, _, filenames in os.walk(path_root):
        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower()
            parser = _SUPPORTED_EXT.get(ext)
            if parser is None:
                continue
            full_path = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(full_path, path_root)
            doc_type = _infer_doc_type(rel_path)
            try:
                parsed = parser(full_path)
            except Exception as exc:
                logger.error("Failed to parse %s: %s", full_path, exc)
                continue
            for section in parsed:
                section.source = _normalize_source(rel_path)
                section.doc_type = doc_type
                standard_level = _infer_standard_level(section.text)
                if standard_level:
                    section.standard_level = standard_level
                elif section.standard_level not in {"required", "recommended"}:
                    section.standard_level = "recommended"
                sections.append(section)
    logger.info("Loaded %d sections from %s", len(sections), path_root)
    return sections


async def _load_graph_mapping(path: str | None) -> None:
    if not path:
        return
    if not os.path.exists(path):
        logger.warning("Graph mapping not found: %s", path)
        return
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except Exception as exc:
        logger.error("Failed to read graph mapping: %s", exc)
        return
    components = data.get("components", [])
    standards = data.get("standards", [])
    dependencies = data.get("dependencies", [])
    if components:
        await upsert_components(components)
    if standards:
        await upsert_standards(standards)
    if dependencies:
        await upsert_dependencies([tuple(edge) for edge in dependencies])


def _iter_sections(sections: Iterable[Section]) -> List[Section]:
    return list(sections)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest local docs into shared stores")
    parser.add_argument(
        "--path",
        required=True,
        help="Root folder containing docs (e.g. data/docs)",
    )
    parser.add_argument(
        "--graph-mapping",
        default=None,
        help="Optional JSON file with components/standards/dependencies",
    )
    args = parser.parse_args()

    root_path = os.path.abspath(args.path)
    sections = _load_sections(root_path)
    if not sections:
        logger.warning("No sections found under %s", root_path)
        return

    logger.info("开始分块与入库: sections=%d", len(sections))
    chunks = chunk_sections(_iter_sections(sections), min_len=200, max_len=1200)
    logger.info("分块完成: chunks=%d", len(chunks))
    vectors = await embed_chunks(chunks)
    await upsert_qdrant(chunks, vectors)
    await _load_graph_mapping(args.graph_mapping)
    logger.info("Local ingestion completed")


if __name__ == "__main__":
    asyncio.run(main())
