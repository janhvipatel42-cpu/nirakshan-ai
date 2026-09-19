"""
Minimal auth utilities for the prototype.

NOTE (prototype scope): this uses a salted-SHA256 hash and a hand-rolled
HMAC session token instead of a production auth stack (e.g. OAuth2 +
bcrypt + refresh tokens). That is a deliberate scope decision for an SIH
demo — swap this module for a hardened implementation before any real
deployment.
"""
import base64
import hashlib
import hmac
import json
import os
import time

from app.config import SECRET_KEY, TOKEN_TTL_SECONDS


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or base64.b16encode(os.urandom(8)).decode()
    digest = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
    return f"{salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, _ = password_hash.split("$", 1)
    except ValueError:
        return False
    return hmac.compare_digest(hash_password(password, salt), password_hash)


def _sign(payload: str) -> str:
    return hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()


def create_token(user_id: int, role: str) -> str:
    payload = {"uid": user_id, "role": role, "exp": time.time() + TOKEN_TTL_SECONDS}
    raw = json.dumps(payload).encode()
    body = base64.urlsafe_b64encode(raw).decode()
    sig = _sign(body)
    return f"{body}.{sig}"


def decode_token(token: str):
    try:
        body, sig = token.split(".", 1)
        if not hmac.compare_digest(_sign(body), sig):
            return None
        payload = json.loads(base64.urlsafe_b64decode(body.encode()))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None
