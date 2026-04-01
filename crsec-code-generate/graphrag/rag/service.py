from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import List

from graphrag.common.logging import get_logger
from graphrag.common.types import DependencyGraph, Result
from graphrag.configs import settings

logger = get_logger(__name__)


def build_prompt(query: str, shared_results: List[Result], graph_context: DependencyGraph) -> str:
    lines: List[str] = []
    lines.append("SYSTEM: You are a senior architect. You must follow enterprise standards.")
    lines.append("")
    lines.append("CONTEXT - Shared Knowledge:")
    if not shared_results:
        lines.append("(no shared results)")
    for idx, result in enumerate(shared_results, start=1):
        lines.append(
            f"[{idx}] source={result.source} doc_type={result.doc_type} "
            f"standard_level={result.standard_level or ''} score={result.score:.2f}"
        )
        lines.append(result.text)
        lines.append("")
    lines.append("GRAPH CONTEXT:")
    lines.append(f"Component: {graph_context.component}")
    lines.append(f"Upstream: {', '.join(graph_context.upstream) if graph_context.upstream else 'none'}")
    lines.append(
        f"Downstream: {', '.join(graph_context.downstream) if graph_context.downstream else 'none'}"
    )
    lines.append(
        f"Standards: {', '.join(graph_context.standards) if graph_context.standards else 'none'}"
    )
    lines.append("")
    lines.append("RULES:")
    lines.append("1. Standards take precedence over preferences.")
    lines.append("2. Component dependency constraints must be followed.")
    lines.append("3. If dependencies are missing, mention required components.")
    lines.append("4. Provide citations with sources.")
    lines.append("")
    lines.append("USER QUERY:")
    lines.append(query)
    prompt = "\n".join(lines)
    logger.info("Prompt built with %d shared results", len(shared_results))
    return prompt


async def generate_answer(prompt: str) -> str:
    if not settings.LLM_API_KEY or not settings.LLM_BASE_URL:
        return _fallback_answer(prompt)
    try:
        return _call_llm(prompt)
    except Exception as exc:
        logger.warning("LLM call failed, using fallback: %s", exc)
        return _fallback_answer(prompt)


def _fallback_answer(prompt: str) -> str:
    sources = _extract_sources(prompt)
    lines = [
        "LLM unavailable. Returning shared context summary.",
        "Follow enterprise standards and dependency constraints.",
    ]
    if sources:
        lines.append("References: " + ", ".join(sources))
    return "\n".join(lines)


def _extract_sources(prompt: str) -> List[str]:
    sources: List[str] = []
    for line in prompt.splitlines():
        if "source=" in line:
            segment = line.split("source=", 1)[1]
            token = segment.split()[0].strip()
            if token and token not in sources:
                sources.append(token)
    return sources


def _call_llm(prompt: str) -> str:
    url = settings.LLM_BASE_URL.rstrip("/") + "/chat/completions"
    payload = {
        "model": settings.LLM_MODEL_ID,
        "messages": [
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    request = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(request, timeout=60) as response:
        body = response.read()
    parsed = json.loads(body.decode("utf-8"))
    choices = parsed.get("choices")
    if not choices:
        raise KeyError("choices")
    message = choices[0].get("message", {})
    content = message.get("content")
    if not content:
        raise KeyError("content")
    return str(content)
