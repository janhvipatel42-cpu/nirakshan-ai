from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginRequest, LoginResponse, RegisterRequest, UserOut
from app.security import create_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=LoginResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    if len(name) < 2:
        raise HTTPException(400, "Please enter your full name.")
    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        raise HTTPException(400, "Please enter a valid email address.")
    if len(payload.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "An account with this email already exists. Please sign in.")

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(payload.password),
        role="inspector",
        designation=(payload.designation or "Legal Metrology Inspector").strip() or "Legal Metrology Inspector",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return LoginResponse(token=create_token(user.id, user.role), user=UserOut.model_validate(user))


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password.")
    if payload.role and payload.role != user.role:
        raise HTTPException(
            401,
            f"This account is registered as {user.role.title()}. "
            f"Please use the {user.role.title()} login tab.",
        )
    token = create_token(user.id, user.role)
    return LoginResponse(token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)
