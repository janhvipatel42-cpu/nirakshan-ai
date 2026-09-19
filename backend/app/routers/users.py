from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import User
from app.schemas import UserOut
from app.security import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "inspector"
    designation: str = "Legal Metrology Inspector"


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(User).order_by(User.id).all()


@router.post("", response_model=UserOut)
def create_user(payload: UserCreateRequest, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "A user with this email already exists.")
    if payload.role not in ("inspector", "admin"):
        raise HTTPException(400, "Role must be 'inspector' or 'admin'.")
    user = User(
        name=payload.name, email=payload.email, role=payload.role,
        designation=payload.designation, password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(400, "You cannot remove your own account.")
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    return {"deleted": True}
