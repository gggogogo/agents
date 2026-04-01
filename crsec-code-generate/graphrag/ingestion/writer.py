from __future__ import annotations

from typing import Iterable, List, Tuple

from graphrag.common.errors import InvalidArgumentError, ServiceUnavailableError
from graphrag.common.logging import get_logger
from graphrag.common.stores import QdrantPoint, get_graph_store, get_qdrant_store
from graphrag.common.types import Chunk, Vector

logger = get_logger(__name__)


async def upsert_qdrant(chunks: List[Chunk], vectors: List[Vector]) -> None:
    if len(chunks) != len(vectors):
        raise InvalidArgumentError("chunks and vectors length mismatch")
    store = get_qdrant_store()
    if not store.is_available():
        raise ServiceUnavailableError("vector store unavailable")

    points: List[QdrantPoint] = []
    for chunk, vector in zip(chunks, vectors):
        payload = {
            "text": chunk.text,
            "doc_type": chunk.doc_type,
            "source": chunk.source,
            "language": _infer_language(chunk.source),
            "tags": chunk.tags,
            "standard_level": chunk.standard_level,
            "offset": chunk.offset,
        }
        points.append(QdrantPoint(id=chunk.id, vector=vector.values, payload=payload))

    batch_size = 200
    for idx in range(0, len(points), batch_size):
        batch = points[idx : idx + batch_size]
        store.upsert(batch)
    logger.info("Upserted %d points into Qdrant", len(points))


async def upsert_components(components: Iterable[str]) -> None:
    store = get_graph_store()
    if not store.is_available():
        raise ServiceUnavailableError("graph store unavailable")
    store.upsert_components(list(components))
    logger.info("Upserted components")


async def upsert_standards(standards: Iterable[str]) -> None:
    store = get_graph_store()
    if not store.is_available():
        raise ServiceUnavailableError("graph store unavailable")
    store.upsert_standards(list(standards))
    logger.info("Upserted standards")


async def upsert_dependencies(edges: Iterable[Tuple[str, str]]) -> None:
    store = get_graph_store()
    if not store.is_available():
        raise ServiceUnavailableError("graph store unavailable")
    store.upsert_edges(list(edges))
    logger.info("Upserted dependency edges")


def _infer_language(source: str) -> str:
    lower = source.lower()
    if lower.endswith(".ts") or lower.endswith(".tsx"):
        return "typescript"
    if lower.endswith(".js") or lower.endswith(".jsx"):
        return "javascript"
    if lower.endswith(".py"):
        return "python"
    if lower.endswith(".md"):
        return "markdown"
    return "unknown"
