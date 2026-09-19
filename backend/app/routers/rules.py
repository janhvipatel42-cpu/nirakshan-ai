from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.models import ComplianceRule, User
from app.schemas import RuleOut, RuleUpdateRequest

router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.get("", response_model=list[RuleOut])
def list_rules(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ComplianceRule).order_by(ComplianceRule.rule_id).all()


@router.put("/{rule_id}", response_model=RuleOut)
def update_rule(
    rule_id: str,
    payload: RuleUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    rule = db.query(ComplianceRule).filter(ComplianceRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(404, "Rule not found")
    if payload.active is not None:
        rule.active = payload.active
    if payload.requirement is not None:
        rule.requirement = payload.requirement
    if payload.version is not None:
        rule.version = payload.version
    db.commit()
    db.refresh(rule)
    return rule
