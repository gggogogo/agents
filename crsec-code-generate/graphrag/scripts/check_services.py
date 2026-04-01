import json
import socket
import urllib.error
import urllib.request

from graphrag.configs import settings


def _print_ok(message: str) -> None:
    print(f"[可用] {message}")


def _print_fail(message: str) -> None:
    print(f"[不可用] {message}")


def _check_qdrant() -> None:
    if not settings.QDRANT_URL:
        _print_fail("Qdrant 未配置 QDRANT_URL")
        return
    url = settings.QDRANT_URL.rstrip("/") + "/collections"
    headers = {}
    if settings.QDRANT_API_KEY:
        headers["api-key"] = settings.QDRANT_API_KEY
    try:
        request = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(request, timeout=5) as response:
            if response.status == 200:
                _print_ok("Qdrant 连接正常")
                return
    except Exception as exc:
        _print_fail(f"Qdrant 连接失败: {exc}")
        return
    _print_fail("Qdrant 连接失败: 状态码异常")


def _check_neo4j() -> None:
    if not settings.NEO4J_URI:
        _print_fail("Neo4j 未配置 NEO4J_URI")
        return
    try:
        from neo4j import GraphDatabase

        driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
            connection_timeout=settings.NEO4J_CONNECTION_TIMEOUT,
        )
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            session.run("RETURN 1").single()
        driver.close()
        _print_ok("Neo4j 连接正常")
    except Exception as exc:
        _print_fail(f"Neo4j 连接失败: {exc}")


def _check_embedding() -> None:
    if not settings.EMBED_BASE_URL or not settings.EMBED_API_KEY:
        _print_fail("Embedding 未配置 EMBED_BASE_URL/EMBED_API_KEY")
        return
    url = settings.EMBED_BASE_URL.rstrip("/") + "/embeddings"
    payload = {"model": settings.EMBED_MODEL_NAME, "input": ["ping"]}
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {settings.EMBED_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        request = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status == 200:
                _print_ok("Embedding 服务连接正常")
                return
    except Exception as exc:
        _print_fail(f"Embedding 连接失败: {exc}")
        return
    _print_fail("Embedding 连接失败: 状态码异常")


def _check_llm() -> None:
    if not settings.LLM_BASE_URL or not settings.LLM_API_KEY:
        _print_fail("LLM 未配置 LLM_BASE_URL/LLM_API_KEY")
        return
    url = settings.LLM_BASE_URL.rstrip("/") + "/chat/completions"
    payload = {
        "model": settings.LLM_MODEL_ID,
        "messages": [{"role": "user", "content": "ping"}],
        "temperature": 0,
        "max_tokens": 1,
    }
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        request = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(request, timeout=15) as response:
            if response.status == 200:
                _print_ok("LLM 服务连接正常")
                return
    except Exception as exc:
        _print_fail(f"LLM 连接失败: {exc}")
        return
    _print_fail("LLM 连接失败: 状态码异常")


def _check_dns() -> None:
    if not settings.NEO4J_URI:
        return
    try:
        host = settings.NEO4J_URI.split("://", 1)[1].split(":", 1)[0]
        socket.getaddrinfo(host, None)
        _print_ok(f"DNS 解析正常: {host}")
    except Exception as exc:
        _print_fail(f"DNS 解析失败: {exc}")


def main() -> None:
    print("开始检测外部服务连通性...")
    _check_dns()
    _check_qdrant()
    _check_neo4j()
    _check_embedding()
    _check_llm()


if __name__ == "__main__":
    main()
