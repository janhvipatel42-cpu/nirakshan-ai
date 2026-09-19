import json
from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Inspection, User
from app.schemas import AnalyticsResponse, DashboardStats

router = APIRouter(prefix="/api", tags=["analytics"])


def _list_item(insp: Inspection):
    return {
        "id": insp.id,
        "inspection_code": insp.inspection_code,
        "product_name": insp.product_name or "—",
        "brand": insp.brand,
        "category": insp.product_category,
        "inspector_name": insp.inspector.name if insp.inspector else None,
        "status": insp.status,
        "overall_result": insp.overall_result,
        "issues_count": insp.issues_count or 0,
        "created_at": insp.created_at,
        "is_demo": insp.is_demo,
    }


@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    completed = db.query(Inspection).filter(Inspection.status == "completed").all()
    counts = Counter(i.overall_result for i in completed)
    recent = sorted(completed, key=lambda i: i.created_at, reverse=True)[:6]
    return DashboardStats(
        total_inspections=len(completed),
        compliant=counts.get("COMPLIANT", 0),
        non_compliant=counts.get("NON_COMPLIANT", 0),
        needs_review=counts.get("NEEDS_REVIEW", 0),
        recent=[_list_item(i) for i in recent],
    )


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics(db: Session = Depends(get_db), _admin: User = Depends(get_current_user)):
    completed = db.query(Inspection).filter(Inspection.status == "completed").all()
    total = len(completed)
    counts = Counter(i.overall_result for i in completed)
    compliance_rate = round(100 * counts.get("COMPLIANT", 0) / total, 1) if total else 0.0

    requirement_failures = Counter()
    for insp in completed:
        for r in json.loads(insp.rule_results_json or "[]"):
            if r["status"] in ("FAIL", "NEEDS_REVIEW"):
                requirement_failures[r["name"]] += 1

    recent = sorted(completed, key=lambda i: i.created_at, reverse=True)[:10]

    return AnalyticsResponse(
        total_inspections=total,
        compliance_rate=compliance_rate,
        by_result={
            "COMPLIANT": counts.get("COMPLIANT", 0),
            "NON_COMPLIANT": counts.get("NON_COMPLIANT", 0),
            "NEEDS_REVIEW": counts.get("NEEDS_REVIEW", 0),
        },
        violations_by_requirement=[{"name": k, "count": v} for k, v in requirement_failures.most_common(8)],
        recent=[_list_item(i) for i in recent],
    )
