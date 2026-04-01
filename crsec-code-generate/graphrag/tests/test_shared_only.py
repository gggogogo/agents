import asyncio
import os
import sys
import unittest

TEST_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, TEST_ROOT)

os.environ.setdefault("ENABLE_PRIVATE_INGESTION", "false")

from graphrag.common.stores import reset_stores
from graphrag.common.types import DependencyGraph, Result, Section
from graphrag.graph.service import check_graph_dependency
from graphrag.ingestion.chunker import chunk_sections
from graphrag.ingestion.embedder import embed_chunks
from graphrag.ingestion.writer import (
    upsert_components,
    upsert_dependencies,
    upsert_qdrant,
    upsert_standards,
)
from graphrag.mcp.server import mcp_get_personal_context
from graphrag.rag.service import build_prompt
from graphrag.retrieval.service import retrieve_standards


class SharedOnlyTests(unittest.TestCase):
    def setUp(self) -> None:
        reset_stores()

    def test_chunker_limits(self) -> None:
        text = "A" * 500 + "\n\n" + "B" * 500 + "\n\n" + "C" * 500
        section = Section(
            title="Test",
            text=text,
            source="test.md",
            tags=["test"],
            doc_type="standard",
            standard_level="recommended",
        )
        chunks = chunk_sections([section], min_len=200, max_len=1200)
        self.assertTrue(chunks)
        for chunk in chunks:
            self.assertGreaterEqual(len(chunk.text), 200)
            self.assertLessEqual(len(chunk.text), 1200)

    def test_qdrant_upsert_and_search(self) -> None:
        if not os.getenv("QDRANT_URL"):
            self.skipTest("QDRANT_URL not set")
        async def run() -> None:
            section = Section(
                title="Button",
                text="Button component is used to trigger primary actions.",
                source="ui/button.md",
                tags=["ui", "button"],
                doc_type="component",
                standard_level="required",
            )
            chunks = chunk_sections([section], min_len=10, max_len=200)
            vectors = await embed_chunks(chunks)
            await upsert_qdrant(chunks, vectors)
            results = await retrieve_standards("Button", top_k=5)
            self.assertTrue(results)
            self.assertEqual(results[0].source, "ui/button.md")

        asyncio.run(run())

    def test_graph_dependency_query(self) -> None:
        if not os.getenv("NEO4J_URI"):
            self.skipTest("NEO4J_URI not set")
        async def run() -> None:
            await upsert_components(["Button", "Theme", "Modal"])
            await upsert_standards(["UI-Consistency"])
            await upsert_dependencies(
                [("Button", "Theme"), ("Modal", "Button"), ("Button", "UI-Consistency")]
            )
            graph = await check_graph_dependency("Button")
            self.assertIn("Theme", graph.upstream)
            self.assertIn("Modal", graph.downstream)
            self.assertIn("UI-Consistency", graph.standards)

        asyncio.run(run())

    def test_prompt_contains_rules(self) -> None:
        results = [
            Result(
                text="Use Button component for primary actions.",
                source="ui/button.md",
                score=0.9,
                doc_type="component",
                standard_level="required",
            )
        ]
        graph = DependencyGraph(
            component="Button",
            upstream=["Theme"],
            downstream=["Modal"],
            standards=["UI-Consistency"],
        )
        prompt = build_prompt("How to use Button", results, graph)
        self.assertIn("Standards take precedence", prompt)
        self.assertIn("source=ui/button.md", prompt)

    def test_get_personal_context_disabled(self) -> None:
        async def run() -> None:
            response = await mcp_get_personal_context(
                {"user_id": "u123", "query": "How to handle errors"}
            )
            self.assertEqual(response.get("results"), [])
            self.assertEqual(response.get("message"), "private ingestion disabled")

        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
