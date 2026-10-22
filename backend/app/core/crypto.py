import base64
import hashlib
import logging
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings

logger = logging.getLogger(__name__)

_fernet_instance: Optional[Fernet] = None


def _get_fernet() -> Fernet:
    """
    Initializes a Fernet cipher instance using a deterministic 32-byte key
    derived from the SUPABASE_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY.
    """
    global _fernet_instance
    if _fernet_instance is None:
        secret_source = settings.SUPABASE_JWT_SECRET or settings.SUPABASE_SERVICE_ROLE_KEY or "fallback-default-secret-key-32bytes!!"
        key_hash = hashlib.sha256(secret_source.encode("utf-8")).digest()
        urlsafe_key = base64.urlsafe_b64encode(key_hash)
        _fernet_instance = Fernet(urlsafe_key)
    return _fernet_instance


def encrypt_secret(plain_text: Optional[str]) -> str:
    """
    Encrypts a sensitive secret string (e.g. Apollo API Key, Twenty CRM token) for storage at rest.
    """
    if not plain_text or not plain_text.strip():
        return ""
    try:
        fernet = _get_fernet()
        cipher_bytes = fernet.encrypt(plain_text.strip().encode("utf-8"))
        return cipher_bytes.decode("utf-8")
    except Exception as e:
        logger.error(f"Failed to encrypt secret: {e}")
        return plain_text


def decrypt_secret(cipher_text: Optional[str]) -> str:
    """
    Decrypts a stored ciphertext secret back into plaintext for external API calls.
    """
    if not cipher_text or not cipher_text.strip():
        return ""
    try:
        fernet = _get_fernet()
        plain_bytes = fernet.decrypt(cipher_text.strip().encode("utf-8"))
        return plain_bytes.decode("utf-8")
    except (InvalidToken, Exception) as e:
        # If text is already plaintext (legacy/mock), return as-is
        logger.debug(f"Ciphertext decrypt fallback (may already be plaintext): {e}")
        return cipher_text
