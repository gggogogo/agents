import asyncio
import json
import os

os.environ.setdefault("ENABLE_PRIVATE_INGESTION", "false")

from graphrag.common.logging import get_logger
from graphrag.common.stores import reset_stores
from graphrag.configs import settings
from graphrag.common.types import Chunk
from graphrag.ingestion.embedder import embed_chunks
from graphrag.ingestion.writer import (
    upsert_components,
    upsert_dependencies,
    upsert_qdrant,
    upsert_standards,
)
from graphrag.mcp.server import (
    mcp_check_graph_dependency,
    mcp_get_personal_context,
    mcp_retrieve_standards,
)


logger = get_logger(__name__)


async def main() -> None:
    missing = settings.get_missing_config()
    if missing:
        logger.error("Missing required config: %s", ", ".join(missing))
        return
    reset_stores()
    chunk = Chunk(
        id="chunk-1",
        text="Button component is used to trigger primary actions.",
        source="ui/button.md",
        tags=["ui", "button"],
        doc_type="component",
        standard_level="required",
        offset=0,
    )
    vectors = await embed_chunks([chunk])
    await upsert_qdrant([chunk], vectors)

    await upsert_components(["Button", "Theme", "Modal"])
    await upsert_standards(["UI-Consistency", "Accessibility"])
    await upsert_dependencies(
        [
            ("Button", "Theme"),
            ("Modal", "Button"),
            ("Button", "UI-Consistency"),
            ("Button", "Accessibility"),
        ]
    )

    retrieve_response = await mcp_retrieve_standards(
        {"query": "How to use Button component", "top_k": 5}
    )
    graph_response = await mcp_check_graph_dependency({"component_name": "Button"})
    personal_response = await mcp_get_personal_context(
        {"user_id": "u123", "query": "How to handle errors"}
    )

    print("retrieve_standards:")
    print(json.dumps(retrieve_response, indent=2))
    print("\ncheck_graph_dependency:")
    print(json.dumps(graph_response, indent=2))
    print("\nget_personal_context:")
    print(json.dumps(personal_response, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
