from __future__ import annotations

import re
from typing import List

from graphrag.common.embedding import embed_texts
from graphrag.common.errors import ServiceUnavailableError
from graphrag.common.logging import get_logger
from graphrag.common.stores import get_qdrant_store
from graphrag.common.types import Result
from graphrag.common.validation import validate_query, validate_top_k
from graphrag.configs import settings

logger = get_logger(__name__)


async def retrieve_standards(query: str, top_k: int | None = None) -> List[Result]:
    validate_query(query)
    if top_k is None:
        top_k = settings.TOP_K
    validate_top_k(top_k)
    logger.info("开始检索: query=%s top_k=%d", query, top_k)

    store = get_qdrant_store()
    if not store.is_available():
        raise ServiceUnavailableError("vector store unavailable")

    logger.info("生成查询向量")
    query_vector = embed_texts([query], dim=settings.QDRANT_VECTOR_SIZE)[0]
    logger.info("向量检索中")
    semantic_limit = top_k
    if settings.HYBRID_ENABLE:
        semantic_limit = max(top_k, settings.HYBRID_RERANK_TOP_K)
    hits = store.search(query_vector, semantic_limit)
    results: List[Result] = []
    for hit in hits:
        payload = hit.get("payload", {})
        results.append(
            Result(
                text=payload.get("text", ""),
                source=payload.get("source", ""),
                score=float(hit.get("score", 0.0)),
                doc_type=payload.get("doc_type", ""),
                standard_level=payload.get("standard_level"),
            )
        )

    if settings.HYBRID_ENABLE:
        logger.info("混合检索重排: alpha=%.2f", settings.HYBRID_ALPHA)
        results = _hybrid_rerank(query, results, settings.HYBRID_ALPHA)
        results = results[:top_k]
    else:
        results = results[:top_k]

    logger.info("检索完成: 结果数=%d", len(results))
    logger.info("Retrieved %d results", len(results))
    return results


def _hybrid_rerank(query: str, results: List[Result], alpha: float) -> List[Result]:
    alpha = min(max(alpha, 0.0), 1.0)
    reranked = []
    for item in results:
        keyword_score = _keyword_score(query, item.text)
        combined = alpha * item.score + (1.0 - alpha) * keyword_score
        reranked.append((combined, item))
    reranked.sort(key=lambda pair: pair[0], reverse=True)
    return [item for _, item in reranked]


_TOKEN_RE = re.compile(r"[A-Za-z0-9_]+|[\u4e00-\u9fff]+")


def _keyword_score(query: str, text: str) -> float:
    if not text:
        return 0.0
    query_tokens = _tokenize(query)
    if not query_tokens:
        return 0.0
    haystack = text.lower()
    score = 0.0
    for token in query_tokens:
        if len(token) <= 1:
            continue
        occurrences = haystack.count(token)
        if occurrences:
            score += min(3, occurrences)
    return score / max(1.0, len(query_tokens))


def _tokenize(text: str) -> List[str]:
    return [match.group(0).lower() for match in _TOKEN_RE.finditer(text)]
