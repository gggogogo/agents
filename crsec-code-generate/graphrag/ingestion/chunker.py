from __future__ import annotations

import re
import uuid
from typing import List

from graphrag.common.logging import get_logger
from graphrag.common.types import Chunk, Section

logger = get_logger(__name__)


def chunk_sections(
    sections: List[Section],
    min_len: int = 200,
    max_len: int = 1200,
) -> List[Chunk]:
    chunks: List[Chunk] = []
    for section in sections:
        section_chunks = _chunk_section(section, min_len, max_len)
        chunks.extend(section_chunks)
    logger.info("Generated %d chunks", len(chunks))
    return chunks


def _chunk_section(section: Section, min_len: int, max_len: int) -> List[Chunk]:
    if max_len < min_len:
        raise ValueError("max_len must be >= min_len")
    chunks: List[Chunk] = []
    paragraphs = _split_paragraphs(section.text)
    buffer_text = ""
    buffer_offset = 0

    def flush_buffer() -> None:
        nonlocal buffer_text, buffer_offset
        if buffer_text:
            enriched = _enrich_text(section, buffer_text)
            chunk_id = _build_chunk_id(section.source, buffer_offset)
            chunks.append(
                Chunk(
                    id=chunk_id,
                    text=enriched,
                    source=section.source,
                    tags=section.tags,
                    doc_type=section.doc_type,
                    standard_level=section.standard_level,
                    offset=buffer_offset,
                )
            )
        buffer_text = ""

    for paragraph, offset in paragraphs:
        if len(paragraph) > max_len:
            flush_buffer()
            for segment_text, segment_offset in _split_long_paragraph(
                paragraph, offset, max_len
            ):
                enriched = _enrich_text(section, segment_text)
                chunk_id = _build_chunk_id(section.source, segment_offset)
                chunks.append(
                    Chunk(
                        id=chunk_id,
                        text=enriched,
                        source=section.source,
                        tags=section.tags,
                        doc_type=section.doc_type,
                        standard_level=section.standard_level,
                        offset=segment_offset,
                    )
                )
            continue

        if not buffer_text:
            buffer_text = paragraph
            buffer_offset = offset
            continue

        candidate_len = len(buffer_text) + 2 + len(paragraph)
        if candidate_len <= max_len:
            buffer_text = f"{buffer_text}\n\n{paragraph}"
        else:
            flush_buffer()
            buffer_text = paragraph
            buffer_offset = offset

    flush_buffer()
    _merge_small_tail(chunks, min_len, max_len)
    return chunks


def _split_paragraphs(text: str) -> List[tuple[str, int]]:
    paragraphs: List[tuple[str, int]] = []
    start = 0
    for match in re.finditer(r"\n\s*\n", text):
        end = match.start()
        paragraph = text[start:end].strip()
        if paragraph:
            paragraphs.append((paragraph, start))
        start = match.end()
    tail = text[start:].strip()
    if tail:
        paragraphs.append((tail, start))
    return paragraphs


def _split_long_paragraph(text: str, offset: int, max_len: int) -> List[tuple[str, int]]:
    segments: List[tuple[str, int]] = []
    for idx in range(0, len(text), max_len):
        segment_text = text[idx : idx + max_len]
        segments.append((segment_text, offset + idx))
    return segments


def _merge_small_tail(chunks: List[Chunk], min_len: int, max_len: int) -> None:
    if len(chunks) < 2:
        return
    last = chunks[-1]
    if len(last.text) >= min_len:
        return
    prev = chunks[-2]
    combined_len = len(prev.text) + 2 + len(last.text)
    if combined_len <= max_len:
        prev.text = f"{prev.text}\n\n{last.text}"
        chunks.pop()


def _build_chunk_id(source: str, offset: int) -> str:
    name = f"{source}:{offset}"
    return str(uuid.uuid5(uuid.NAMESPACE_URL, name))


def _enrich_text(section: Section, text: str) -> str:
    prefix = f"[title] {section.title}\n[source] {section.source}\n"
    return prefix + text
