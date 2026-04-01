from __future__ import annotations

import dataclasses
from typing import List


@dataclasses.dataclass
class Section:
    title: str
    text: str
    source: str
    tags: List[str]
    doc_type: str
    standard_level: str


@dataclasses.dataclass
class Chunk:
    id: str
    text: str
    source: str
    tags: List[str]
    doc_type: str
    standard_level: str
    offset: int


@dataclasses.dataclass
class Vector:
    id: str
    values: List[float]


@dataclasses.dataclass
class Result:
    text: str
    source: str
    score: float
    doc_type: str
    standard_level: str | None = None


@dataclasses.dataclass
class DependencyGraph:
    component: str
    upstream: List[str]
    downstream: List[str]
    standards: List[str]
