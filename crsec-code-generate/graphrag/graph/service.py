from __future__ import annotations

from graphrag.common.errors import NotFoundError, ServiceUnavailableError
from graphrag.common.logging import get_logger
from graphrag.common.stores import get_graph_store
from graphrag.common.types import DependencyGraph
from graphrag.common.validation import validate_component_name

logger = get_logger(__name__)


async def check_graph_dependency(component_name: str) -> DependencyGraph:
    validate_component_name(component_name)
    store = get_graph_store()
    if not store.is_available():
        raise ServiceUnavailableError("graph store unavailable")
    if not store.has_component(component_name):
        raise NotFoundError(f"component not found: {component_name}")

    data = store.get_dependency(component_name)
    logger.info("Graph dependency query for %s", component_name)
    return DependencyGraph(
        component=component_name,
        upstream=data.get("upstream", []),
        downstream=data.get("downstream", []),
        standards=data.get("standards", []),
    )
