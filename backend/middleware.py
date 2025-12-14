from fastapi import Request
from ueba import log_api_usage

async def ueba_middleware(request: Request, call_next):
    response = await call_next(request)

    user_id = request.headers.get("X-User-Id")
    role = request.headers.get("X-Role")

    if user_id and role:
        log_api_usage(
            user_id=user_id,
            role=role,
            endpoint=request.url.path
        )

    return response
