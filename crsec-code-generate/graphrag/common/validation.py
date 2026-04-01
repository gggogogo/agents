import re

from graphrag.common.errors import InvalidArgumentError

_QUERY_MIN_LEN = 1
_QUERY_MAX_LEN = 2000

_USER_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{3,64}$")


def validate_query(query: str) -> None:
    if not isinstance(query, str) or not query.strip():
        raise InvalidArgumentError("query must be a non-empty string")
    length = len(query)
    if length < _QUERY_MIN_LEN or length > _QUERY_MAX_LEN:
        raise InvalidArgumentError("query must be between 1 and 2000 characters")


def validate_top_k(top_k: int) -> None:
    if not isinstance(top_k, int):
        raise InvalidArgumentError("top_k must be an integer")
    if top_k < 1 or top_k > 20:
        raise InvalidArgumentError("top_k must be between 1 and 20")


def validate_component_name(component_name: str) -> None:
    if not isinstance(component_name, str) or not component_name.strip():
        raise InvalidArgumentError("component_name must be a non-empty string")


def validate_user_id(user_id: str) -> None:
    if not isinstance(user_id, str) or not _USER_ID_RE.match(user_id):
        raise InvalidArgumentError("user_id must match [a-zA-Z0-9_-]{3,64}")
