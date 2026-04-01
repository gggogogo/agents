import dataclasses


@dataclasses.dataclass
class ApiError(Exception):
    code: str
    message: str

    def to_dict(self) -> dict:
        return {"error": {"code": self.code, "message": self.message}}


class InvalidArgumentError(ApiError):
    def __init__(self, message: str) -> None:
        super().__init__(code="INVALID_ARGUMENT", message=message)


class NotFoundError(ApiError):
    def __init__(self, message: str) -> None:
        super().__init__(code="NOT_FOUND", message=message)


class ServiceUnavailableError(ApiError):
    def __init__(self, message: str) -> None:
        super().__init__(code="SERVICE_UNAVAILABLE", message=message)


class InternalError(ApiError):
    def __init__(self, message: str) -> None:
        super().__init__(code="INTERNAL_ERROR", message=message)
