from __future__ import annotations

import asyncio
from typing import List

from graphrag.common.embedding import embed_texts
from graphrag.common.logging import get_logger
from graphrag.configs import settings
from graphrag.common.types import Chunk, Vector

logger = get_logger(__name__)


async def embed_chunks(chunks: List[Chunk]) -> List[Vector]:
    texts = [chunk.text for chunk in chunks]
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            vectors = embed_texts(texts, dim=settings.QDRANT_VECTOR_SIZE)
            results = [
                Vector(id=chunk.id, values=vector) for chunk, vector in zip(chunks, vectors)
            ]
            logger.info("Embedded %d chunks", len(results))
            return results
        except Exception as exc:
            last_error = exc
            logger.warning("Embedding failed (attempt %d): %s", attempt + 1, exc)
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)
    raise last_error if last_error else RuntimeError("embedding failed")
