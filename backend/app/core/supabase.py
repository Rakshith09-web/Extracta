from typing import Optional
from supabase import create_client, Client, ClientOptions
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_admin_client: Optional[Client] = None


def get_supabase_admin_client() -> Client:
    """
    Returns a Supabase client using the SUPABASE_SERVICE_ROLE_KEY.
    Used ONLY for server-side elevated background operations.
    Bypasses Row Level Security (RLS).
    """
    global _admin_client
    if _admin_client is None:
        try:
            _admin_client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY,
                options=ClientOptions(
                    auto_refresh_token=False,
                    persist_session=False
                )
            )
        except Exception as e:
            logger.warning(f"Could not initialize Supabase admin client: {e}")
            # Fallback client if placeholder url
            _admin_client = create_client(
                supabase_url="https://placeholder.supabase.co",
                supabase_key="placeholder-key",
                options=ClientOptions(auto_refresh_token=False, persist_session=False)
            )
    return _admin_client


def get_supabase_user_client(access_token: str) -> Client:
    """
    Creates a Supabase client scoped to an authenticated user's JWT.
    All operations will automatically inherit and enforce PostgreSQL Row Level Security (RLS).
    """
    options = ClientOptions(
        headers={"Authorization": f"Bearer {access_token}"},
        auto_refresh_token=False,
        persist_session=False
    )
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_PUBLISHABLE_KEY,
        options=options
    )
