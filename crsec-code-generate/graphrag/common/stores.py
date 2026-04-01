from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple

from graphrag.common.errors import ServiceUnavailableError
from graphrag.common.logging import get_logger
from graphrag.configs import settings

logger = get_logger(__name__)


@dataclass
class QdrantPoint:
    id: str
    vector: List[float]
    payload: Dict[str, Any]


class QdrantStoreBase:
    def is_available(self) -> bool:
        raise NotImplementedError

    def upsert(self, points: Iterable[QdrantPoint]) -> None:
        raise NotImplementedError

    def search(self, query_vector: List[float], top_k: int) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def clear(self) -> None:
        raise NotImplementedError


class InMemoryQdrantStore(QdrantStoreBase):
    def __init__(self) -> None:
        self._points: Dict[str, QdrantPoint] = {}

    def is_available(self) -> bool:
        return True

    def upsert(self, points: Iterable[QdrantPoint]) -> None:
        for point in points:
            self._points[point.id] = point

    def search(self, query_vector: List[float], top_k: int) -> List[Dict[str, Any]]:
        results: List[Tuple[float, QdrantPoint]] = []
        for point in self._points.values():
            score = _cosine_similarity(query_vector, point.vector)
            results.append((score, point))
        results.sort(key=lambda item: item[0], reverse=True)
        top = results[:top_k]
        return [
            {
                "score": score,
                "payload": point.payload,
            }
            for score, point in top
        ]

    def clear(self) -> None:
        self._points.clear()


class UnavailableQdrantStore(QdrantStoreBase):
    def is_available(self) -> bool:
        return False

    def upsert(self, points: Iterable[QdrantPoint]) -> None:
        raise ServiceUnavailableError("vector store unavailable")

    def search(self, query_vector: List[float], top_k: int) -> List[Dict[str, Any]]:
        raise ServiceUnavailableError("vector store unavailable")

    def clear(self) -> None:
        return None


class RealQdrantStore(QdrantStoreBase):
    def __init__(self, client: Any) -> None:
        self._client = client
        self._collection = settings.QDRANT_COLLECTION

    def is_available(self) -> bool:
        return True

    def upsert(self, points: Iterable[QdrantPoint]) -> None:
        from qdrant_client.http import models as qmodels

        point_structs = [
            qmodels.PointStruct(id=point.id, vector=point.vector, payload=point.payload)
            for point in points
        ]
        self._client.upsert(collection_name=self._collection, points=point_structs)

    def search(self, query_vector: List[float], top_k: int) -> List[Dict[str, Any]]:
        response = self._client.query_points(
            collection_name=self._collection,
            query=query_vector,
            limit=top_k,
            with_payload=True,
        )
        return [
            {
                "score": point.score,
                "payload": point.payload,
            }
            for point in response.points
        ]

    def clear(self) -> None:
        return None


@dataclass
class DependencyData:
    components: set
    standards: set
    depends_on: Dict[str, set]
    required_by: Dict[str, set]
    complies_with: Dict[str, set]


class GraphStoreBase:
    def is_available(self) -> bool:
        raise NotImplementedError

    def upsert_components(self, components: Iterable[str]) -> None:
        raise NotImplementedError

    def upsert_standards(self, standards: Iterable[str]) -> None:
        raise NotImplementedError

    def upsert_edges(self, edges: Iterable[Tuple[str, str]]) -> None:
        raise NotImplementedError

    def get_dependency(self, component: str) -> Dict[str, List[str]]:
        raise NotImplementedError

    def has_component(self, component: str) -> bool:
        raise NotImplementedError

    def clear(self) -> None:
        raise NotImplementedError


class InMemoryGraphStore(GraphStoreBase):
    def __init__(self) -> None:
        self._data = DependencyData(
            components=set(),
            standards=set(),
            depends_on={},
            required_by={},
            complies_with={},
        )

    def is_available(self) -> bool:
        return True

    def upsert_components(self, components: Iterable[str]) -> None:
        for component in components:
            self._data.components.add(component)
            self._data.depends_on.setdefault(component, set())
            self._data.required_by.setdefault(component, set())
            self._data.complies_with.setdefault(component, set())

    def upsert_standards(self, standards: Iterable[str]) -> None:
        for standard in standards:
            self._data.standards.add(standard)

    def upsert_edges(self, edges: Iterable[Tuple[str, str]]) -> None:
        for source, target in edges:
            if target in self._data.standards:
                self._data.complies_with.setdefault(source, set()).add(target)
                continue
            self._data.components.add(source)
            self._data.components.add(target)
            self._data.depends_on.setdefault(source, set()).add(target)
            self._data.required_by.setdefault(target, set()).add(source)

    def get_dependency(self, component: str) -> Dict[str, List[str]]:
        return {
            "upstream": sorted(self._data.depends_on.get(component, set())),
            "downstream": sorted(self._data.required_by.get(component, set())),
            "standards": sorted(self._data.complies_with.get(component, set())),
        }

    def has_component(self, component: str) -> bool:
        return component in self._data.components

    def clear(self) -> None:
        self._data.components.clear()
        self._data.standards.clear()
        self._data.depends_on.clear()
        self._data.required_by.clear()
        self._data.complies_with.clear()


class UnavailableGraphStore(GraphStoreBase):
    def is_available(self) -> bool:
        return False

    def upsert_components(self, components: Iterable[str]) -> None:
        raise ServiceUnavailableError("graph store unavailable")

    def upsert_standards(self, standards: Iterable[str]) -> None:
        raise ServiceUnavailableError("graph store unavailable")

    def upsert_edges(self, edges: Iterable[Tuple[str, str]]) -> None:
        raise ServiceUnavailableError("graph store unavailable")

    def get_dependency(self, component: str) -> Dict[str, List[str]]:
        raise ServiceUnavailableError("graph store unavailable")

    def has_component(self, component: str) -> bool:
        return False

    def clear(self) -> None:
        return None


class RealGraphStore(GraphStoreBase):
    def __init__(self, driver: Any) -> None:
        self._driver = driver
        self._standards_cache: set[str] = set()

    def is_available(self) -> bool:
        return True

    def upsert_components(self, components: Iterable[str]) -> None:
        query = "MERGE (c:Component {name: $name})"
        with self._driver.session(database=settings.NEO4J_DATABASE) as session:
            for component in components:
                session.run(query, name=component)

    def upsert_standards(self, standards: Iterable[str]) -> None:
        query = "MERGE (s:Standard {name: $name})"
        with self._driver.session(database=settings.NEO4J_DATABASE) as session:
            for standard in standards:
                session.run(query, name=standard)
                self._standards_cache.add(standard)

    def upsert_edges(self, edges: Iterable[Tuple[str, str]]) -> None:
        with self._driver.session(database=settings.NEO4J_DATABASE) as session:
            for source, target in edges:
                if target in self._standards_cache:
                    query = (
                        "MATCH (c:Component {name: $source}), "
                        "(s:Standard {name: $target}) "
                        "MERGE (c)-[:COMPLIES_WITH]->(s)"
                    )
                else:
                    query = (
                        "MATCH (c:Component {name: $source}), "
                        "(d:Component {name: $target}) "
                        "MERGE (c)-[:DEPENDS_ON]->(d)"
                    )
                session.run(query, source=source, target=target)

    def get_dependency(self, component: str) -> Dict[str, List[str]]:
        with self._driver.session(database=settings.NEO4J_DATABASE) as session:
            upstream = session.run(
                "MATCH (c:Component {name: $name})-[:DEPENDS_ON]->(u:Component) "
                "RETURN u.name AS name",
                name=component,
            )
            downstream = session.run(
                "MATCH (d:Component)-[:DEPENDS_ON]->(c:Component {name: $name}) "
                "RETURN d.name AS name",
                name=component,
            )
            standards = session.run(
                "MATCH (c:Component {name: $name})-[:COMPLIES_WITH]->(s:Standard) "
                "RETURN s.name AS name",
                name=component,
            )
            return {
                "upstream": sorted([record["name"] for record in upstream]),
                "downstream": sorted([record["name"] for record in downstream]),
                "standards": sorted([record["name"] for record in standards]),
            }

    def has_component(self, component: str) -> bool:
        with self._driver.session(database=settings.NEO4J_DATABASE) as session:
            result = session.run(
                "MATCH (c:Component {name: $name}) RETURN c.name AS name",
                name=component,
            )
            return result.single() is not None

    def clear(self) -> None:
        return None


_QDRANT_STORE: Optional[QdrantStoreBase] = None
_GRAPH_STORE: Optional[GraphStoreBase] = None


def _init_qdrant_store() -> QdrantStoreBase:
    if not settings.QDRANT_URL:
        logger.warning("Qdrant URL not configured; vector store unavailable")
        return UnavailableQdrantStore()
    try:
        from qdrant_client import QdrantClient

        if settings.QDRANT_COLLECTION != "code_knowledge":
            logger.warning("Overriding collection name to code_knowledge")
        client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            timeout=settings.QDRANT_TIMEOUT,
        )
        return RealQdrantStore(client)
    except Exception as exc:
        logger.error("Failed to initialize Qdrant client: %s", exc)
        return UnavailableQdrantStore()


def _init_graph_store() -> GraphStoreBase:
    if not settings.NEO4J_URI:
        logger.warning("Neo4j URI not configured; graph store unavailable")
        return UnavailableGraphStore()
    try:
        from neo4j import GraphDatabase

        driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
            connection_timeout=settings.NEO4J_CONNECTION_TIMEOUT,
        )
        return RealGraphStore(driver)
    except Exception as exc:
        logger.error("Failed to initialize Neo4j driver: %s", exc)
        return UnavailableGraphStore()


def get_qdrant_store() -> QdrantStoreBase:
    global _QDRANT_STORE
    if _QDRANT_STORE is None:
        _QDRANT_STORE = _init_qdrant_store()
    return _QDRANT_STORE


def get_graph_store() -> GraphStoreBase:
    global _GRAPH_STORE
    if _GRAPH_STORE is None:
        _GRAPH_STORE = _init_graph_store()
    return _GRAPH_STORE


def reset_stores() -> None:
    global _QDRANT_STORE, _GRAPH_STORE
    _QDRANT_STORE = None
    _GRAPH_STORE = None


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)
