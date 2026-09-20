"""
Central configuration for Nirakshan AI backend.

This is a Smart India Hackathon prototype. Secrets below are placeholders
for local demo use only and must be replaced before any real deployment.
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNTIME_DIR = "/tmp/nirakshan-ai" if os.getenv("VERCEL") == "1" else BASE_DIR
os.makedirs(RUNTIME_DIR, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{RUNTIME_DIR}/nirakshan.db")

# Used only to sign short-lived demo session tokens (HMAC), NOT a production
# secret management solution. Override via env var for anything beyond a
# local demo.
SECRET_KEY = os.getenv("SECRET_KEY", "nirakshan-ai-sih26034-demo-secret-change-me")
TOKEN_TTL_SECONDS = 8 * 60 * 60  # 8 hour demo session

UPLOAD_DIR = os.path.join(RUNTIME_DIR, "uploads")
DEMO_ASSETS_DIR = os.path.join(BASE_DIR, "demo_assets")
RULES_FILE = os.path.join(BASE_DIR, "data", "compliance_rules.json")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Below this OCR/extraction confidence, a PASS-eligible field is downgraded
# to NEEDS_REVIEW instead of PASS, even if the value looks well formed.
CONFIDENCE_REVIEW_THRESHOLD = 70

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
