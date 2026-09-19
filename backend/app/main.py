from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import CORS_ORIGINS, UPLOAD_DIR
from app.database import Base, engine
from app.routers import analytics, auth, inspections, rules, users
from app.seed import run as seed_run

app = FastAPI(
    title="Nirakshan AI",
    description="AI-Powered Packaged Commodity Compliance Inspection System — SIH26034",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(inspections.router)
app.include_router(rules.router)
app.include_router(users.router)
app.include_router(analytics.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_run()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Nirakshan AI backend"}
