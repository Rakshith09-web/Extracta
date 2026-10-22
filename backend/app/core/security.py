from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, status
from app.core.config import settings
import httpx
import logging

logger = logging.getLogger(__name__)


def decode_access_token_unverified(token: str) -> Dict[str, Any]:
    """
    Decodes the JWT header and payload without verifying signature
    (useful for extracting claims when verifying via Supabase Auth API).
    """
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except Exception as e:
        logger.error(f"Error decoding JWT without verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not decode authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verifies Supabase JWT token.
    1. If SUPABASE_JWT_SECRET is set, verifies the HMAC signature locally.
    2. Otherwise, verifies token against Supabase Auth /auth/v1/user endpoint.
    """
    if settings.SUPABASE_JWT_SECRET and settings.SUPABASE_JWT_SECRET != "":
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.PyJWTError as e:
            logger.warning(f"Local JWT verification failed: {e}. Falling back to remote Supabase verification.")

    # Remote verification via Supabase Auth endpoint
    auth_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
    headers = {
        "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
        "Authorization": f"Bearer {token}"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(auth_url, headers=headers)
            if response.status_code != 200:
                logger.warning(f"Supabase auth check failed with status {response.status_code}: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired Supabase authentication session",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            user_data = response.json()
            # Construct standard payload dictionary from Supabase user object
            return {
                "sub": user_data.get("id"),
                "email": user_data.get("email"),
                "role": user_data.get("role", "authenticated"),
                "user_metadata": user_data.get("user_metadata", {}),
                "app_metadata": user_data.get("app_metadata", {})
            }
    except httpx.RequestError as e:
        logger.error(f"Failed to reach Supabase Auth server: {e}")
        # If in local development or mock mode without internet:
        if settings.MOCK_EXTERNAL_SERVICES and "placeholder" in settings.SUPABASE_URL:
            # Fallback mock payload for mock dev
            return decode_access_token_unverified(token)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable",
        )
