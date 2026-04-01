import os
from pathlib import Path


def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value and value[0] in {"\"", "'"} and value[-1] == value[0]:
            value = value[1:-1]
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv()


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


ENABLE_PRIVATE_INGESTION = _get_bool("ENABLE_PRIVATE_INGESTION", False)
USE_IN_MEMORY_STORES = _get_bool("USE_IN_MEMORY_STORES", False)

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = "code_knowledge"
QDRANT_VECTOR_SIZE = int(os.getenv("QDRANT_VECTOR_SIZE", "512"))
QDRANT_TIMEOUT = float(os.getenv("QDRANT_TIMEOUT", "10"))

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")
NEO4J_CONNECTION_TIMEOUT = float(os.getenv("NEO4J_CONNECTION_TIMEOUT", "10"))

EMBED_MODEL_TYPE = os.getenv("EMBED_MODEL_TYPE", "mock")
EMBED_MODEL_NAME = os.getenv("EMBED_MODEL_NAME", "mock-embedding")
EMBED_API_KEY = os.getenv("EMBED_API_KEY")
EMBED_BASE_URL = os.getenv("EMBED_BASE_URL")

EMBED_DIM = int(os.getenv("EMBED_DIM", str(QDRANT_VECTOR_SIZE)))

TOP_K = int(os.getenv("TOP_K", "5"))

HYBRID_ENABLE = _get_bool("HYBRID_ENABLE", True)
HYBRID_ALPHA = float(os.getenv("HYBRID_ALPHA", "0.7"))
HYBRID_RERANK_TOP_K = int(os.getenv("HYBRID_RERANK_TOP_K", "30"))

LLM_MODEL_ID = os.getenv("LLM_MODEL_ID", "mock-llm")
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL")
ENABLE_LLM_CALL = _get_bool("ENABLE_LLM_CALL", False)

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


def get_missing_config() -> list[str]:
    missing: list[str] = []
    if not USE_IN_MEMORY_STORES:
        if not QDRANT_URL:
            missing.append("QDRANT_URL")
        if not NEO4J_URI:
            missing.append("NEO4J_URI")
        if not NEO4J_USERNAME:
            missing.append("NEO4J_USERNAME")
        if not NEO4J_PASSWORD:
            missing.append("NEO4J_PASSWORD")
    if ENABLE_LLM_CALL:
        if not LLM_API_KEY:
            missing.append("LLM_API_KEY")
        if not LLM_BASE_URL:
            missing.append("LLM_BASE_URL")
        if not LLM_MODEL_ID:
            missing.append("LLM_MODEL_ID")
    return missing
