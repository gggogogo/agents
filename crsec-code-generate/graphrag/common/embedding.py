import json
import time
import urllib.error
import urllib.request
from typing import Iterable, List

from graphrag.common.errors import ServiceUnavailableError
from graphrag.common.logging import get_logger
from graphrag.configs import settings

logger = get_logger(__name__)


def embed_texts(texts: Iterable[str], dim: int | None = None) -> List[List[float]]:
    if not settings.EMBED_BASE_URL or not settings.EMBED_API_KEY:
        raise ServiceUnavailableError("embedding service unavailable")
    inputs = list(texts)
    if not inputs:
        return []
    logger.info("开始生成向量: 文本数=%d", len(inputs))
    vectors: List[List[float]] = []
    batch_size = 10
    for start in range(0, len(inputs), batch_size):
        batch = inputs[start : start + batch_size]
        logger.info("向量批次: %d-%d", start + 1, start + len(batch))
        batch_vectors = _call_embeddings(batch, dim=dim)
        vectors.extend(batch_vectors)
    return vectors


def _call_embeddings(batch: List[str], dim: int | None = None) -> List[List[float]]:
    payload = {
        "model": settings.EMBED_MODEL_NAME,
        "input": batch,
    }
    url = _build_embeddings_url(settings.EMBED_BASE_URL)
    headers = {
        "Authorization": f"Bearer {settings.EMBED_API_KEY}",
        "Content-Type": "application/json",
    }
    data = json.dumps(payload).encode("utf-8")
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read()
            parsed = json.loads(body.decode("utf-8"))
            vectors = _parse_embeddings_response(parsed)
            if dim is not None:
                vectors = [vector[:dim] for vector in vectors]
            logger.info("Fetched %d embeddings from %s", len(vectors), url)
            return vectors
        except urllib.error.HTTPError as exc:
            last_error = exc
            detail = exc.read().decode("utf-8", errors="ignore")
            logger.warning(
                "Embedding call failed (attempt %d): %s %s",
                attempt + 1,
                exc,
                detail,
            )
        except (urllib.error.URLError, ValueError, KeyError) as exc:
            last_error = exc
            logger.warning("Embedding call failed (attempt %d): %s", attempt + 1, exc)
        if attempt < 2:
            time.sleep(2 ** attempt)
    raise ServiceUnavailableError(f"embedding service unavailable: {last_error}")


def _build_embeddings_url(base_url: str) -> str:
    return base_url.rstrip("/") + "/embeddings"


def _parse_embeddings_response(payload: dict) -> List[List[float]]:
    data = payload.get("data")
    if not isinstance(data, list):
        raise KeyError("data")
    embeddings: List[List[float]] = []
    for item in data:
        vector = item.get("embedding")
        if not isinstance(vector, list):
            raise KeyError("embedding")
        embeddings.append([float(value) for value in vector])
    return embeddings
