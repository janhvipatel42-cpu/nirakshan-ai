from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginRequest, LoginResponse, UserOut
from app.security import create_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


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
