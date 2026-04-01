from __future__ import annotations

from typing import Any, Callable, Dict

from graphrag.common.errors import ApiError
from graphrag.common.logging import get_logger
from graphrag.common.validation import validate_query, validate_user_id
from graphrag.configs import settings
from graphrag.graph.service import check_graph_dependency
from graphrag.retrieval.service import retrieve_standards

logger = get_logger(__name__)

_TOOL_REGISTRY: Dict[str, Callable[..., Any]] = {}


def register_tools() -> None:
    _TOOL_REGISTRY["retrieve_standards"] = mcp_retrieve_standards
    _TOOL_REGISTRY["check_graph_dependency"] = mcp_check_graph_dependency
    _TOOL_REGISTRY["get_personal_context"] = mcp_get_personal_context
    missing = settings.get_missing_config()
    if missing:
        logger.warning("Missing required config: %s", ", ".join(missing))
    logger.info("MCP tools registered: %s", ", ".join(_TOOL_REGISTRY.keys()))


async def mcp_retrieve_standards(args: Dict[str, Any]) -> Dict[str, Any]:
    try:
        query = args.get("query")
        top_k = args.get("top_k")
        results = await retrieve_standards(query=query, top_k=top_k)
        return {"results": [result.__dict__ for result in results]}
    except ApiError as exc:
        return exc.to_dict()
    except Exception as exc:  # pragma: no cover - unexpected
        logger.error("Unexpected error in retrieve_standards: %s", exc)
        return {"error": {"code": "INTERNAL_ERROR", "message": "internal error"}}


async def mcp_check_graph_dependency(args: Dict[str, Any]) -> Dict[str, Any]:
    try:
        component_name = args.get("component_name")
        graph = await check_graph_dependency(component_name)
        return {
            "component": graph.component,
            "upstream": graph.upstream,
            "downstream": graph.downstream,
            "standards": graph.standards,
        }
    except ApiError as exc:
        return exc.to_dict()
    except Exception as exc:  # pragma: no cover - unexpected
        logger.error("Unexpected error in check_graph_dependency: %s", exc)
        return {"error": {"code": "INTERNAL_ERROR", "message": "internal error"}}


async def mcp_get_personal_context(args: Dict[str, Any]) -> Dict[str, Any]:
    try:
        user_id = args.get("user_id")
        query = args.get("query")
        validate_user_id(user_id)
        validate_query(query)
        if not settings.ENABLE_PRIVATE_INGESTION:
            return {"results": [], "message": "private ingestion disabled"}
        return {"results": [], "message": "private ingestion disabled"}
    except ApiError as exc:
        return exc.to_dict()
    except Exception as exc:  # pragma: no cover - unexpected
        logger.error("Unexpected error in get_personal_context: %s", exc)
        return {"error": {"code": "INTERNAL_ERROR", "message": "internal error"}}


def get_registered_tools() -> Dict[str, Callable[..., Any]]:
    return dict(_TOOL_REGISTRY)
