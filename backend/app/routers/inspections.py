import datetime as dt
import json
import os
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app import image_quality, ocr_engine, extraction, rules_engine
from app.config import UPLOAD_DIR
from app.database import get_db
from app.deps import get_current_user
from app.models import ComplianceRule, ImageAsset, Inspection, User
from app.pdf_report import build_report_pdf
from app.schemas import InspectionCreateRequest, InspectionDetail, InspectionListItem
from app.security import decode_token

router = APIRouter(prefix="/api/inspections", tags=["inspections"])

DEMO_KEY_TO_SUFFIX = {"compliant": "0001", "non_compliant": "0002", "needs_review": "0003"}


def _next_inspection_code(db: Session) -> str:
    year = dt.datetime.utcnow().year
    count = db.query(Inspection).filter(Inspection.is_demo == False).count()  # noqa: E712
    return f"NIR-{year}-{count + 1:05d}"


def _to_detail(insp: Inspection) -> InspectionDetail:
    return InspectionDetail(
        id=insp.id,
        inspection_code=insp.inspection_code,
        product_category=insp.product_category,
        product_name=insp.product_name,
        brand=insp.brand,
        other_details=insp.other_details,
        is_imported=insp.is_imported,
        inspector_name=insp.inspector.name if insp.inspector else None,
        status=insp.status,
        overall_result=insp.overall_result,
        issues_count=insp.issues_count or 0,
        image_quality=json.loads(insp.image_quality_json or "{}"),
        ocr_text=insp.ocr_text or "",
        ocr_mode=insp.ocr_mode or "pending",
        extracted_data=json.loads(insp.extracted_data_json or "{}"),
        rule_results=json.loads(insp.rule_results_json or "[]"),
        images=[{"id": im.id, "image_type": im.image_type, "url": f"/uploads/{im.file_path}"} for im in insp.images],
        is_demo=insp.is_demo,
        created_at=insp.created_at,
        completed_at=insp.completed_at,
    )


def _to_list_item(insp: Inspection) -> InspectionListItem:
    return InspectionListItem(
        id=insp.id,
        inspection_code=insp.inspection_code,
        product_name=insp.product_name or "—",
        brand=insp.brand,
        category=insp.product_category,
        inspector_name=insp.inspector.name if insp.inspector else None,
        status=insp.status,
        overall_result=insp.overall_result,
        issues_count=insp.issues_count or 0,
        created_at=insp.created_at,
        is_demo=insp.is_demo,
    )


@router.post("", response_model=InspectionDetail)
def create_inspection(
    payload: InspectionCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    insp = Inspection(
        inspection_code=_next_inspection_code(db),
        product_category=payload.product_category,
        product_name=payload.product_name,
        brand=payload.brand,
        other_details=payload.other_details,
        is_imported=payload.is_imported,
        inspector_id=user.id,
        status="draft",
    )
    db.add(insp)
    db.commit()
    db.refresh(insp)
    return _to_detail(insp)


@router.post("/{inspection_id}/images", response_model=InspectionDetail)
def upload_images(
    inspection_id: int,
    front: Optional[UploadFile] = File(None),
    back: Optional[UploadFile] = File(None),
    side: Optional[UploadFile] = File(None),
    additional: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    insp = db.query(Inspection).get(inspection_id)
    if not insp:
        raise HTTPException(404, "Inspection not found")

    inspection_dir = os.path.join(UPLOAD_DIR, str(inspection_id))
    os.makedirs(inspection_dir, exist_ok=True)

    uploads = {"front": front, "back": back, "side": side, "additional": additional}
    saved_any = False
    for image_type, upload in uploads.items():
        if upload is None:
            continue
        ext = os.path.splitext(upload.filename or "")[1] or ".jpg"
        filename = f"{image_type}{ext}"
        dest = os.path.join(inspection_dir, filename)
        with open(dest, "wb") as f:
            f.write(upload.file.read())
        db.query(ImageAsset).filter(
            ImageAsset.inspection_id == inspection_id, ImageAsset.image_type == image_type
        ).delete()
        db.add(ImageAsset(
            inspection_id=inspection_id, image_type=image_type,
            file_path=f"{inspection_id}/{filename}", original_filename=upload.filename,
        ))
        saved_any = True

    if not saved_any:
        raise HTTPException(400, "At least one image (front/back/side/additional) is required.")

    insp.status = "images_uploaded"
    db.commit()
    db.refresh(insp)
    return _to_detail(insp)


@router.post("/{inspection_id}/analyze", response_model=InspectionDetail)
def analyze_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    insp = db.query(Inspection).get(inspection_id)
    if not insp:
        raise HTTPException(404, "Inspection not found")
    if not insp.images:
        raise HTTPException(400, "Upload at least one image before running analysis.")

    image_paths = [os.path.join(UPLOAD_DIR, im.file_path) for im in insp.images]

    quality = image_quality.analyze_images(image_paths)
    ocr_result = ocr_engine.run_ocr(image_paths)
    quality["text_readability"] = ocr_engine.readability_from_ocr(ocr_result)

    extracted = extraction.extract_fields(
        ocr_result["text"], ocr_result["mode"], ocr_result["avg_confidence"],
        insp.product_name or "", insp.product_category or "",
    )

    active_rules = [
        {
            "rule_id": r.rule_id, "name": r.name, "legal_reference": r.legal_reference,
            "field_key": r.field_key, "check_type": r.check_type,
            "applicability": r.applicability, "active": r.active,
        }
        for r in db.query(ComplianceRule).filter(ComplianceRule.active == True).all()  # noqa: E712
    ]
    rule_results = rules_engine.evaluate_rules(extracted, quality, insp.is_imported, active_rules)
    overall, issues = rules_engine.overall_result_from(rule_results)

    insp.image_quality_json = json.dumps(quality)
    insp.ocr_text = ocr_result["text"]
    insp.ocr_mode = ocr_result["mode"]
    insp.extracted_data_json = json.dumps(extracted)
    insp.rule_results_json = json.dumps(rule_results)
    insp.overall_result = overall
    insp.issues_count = issues
    insp.status = "completed"
    insp.completed_at = dt.datetime.utcnow()
    db.commit()
    db.refresh(insp)
    return _to_detail(insp)


@router.get("/demo/{key}", response_model=InspectionDetail)
def get_demo_inspection(key: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    suffix = DEMO_KEY_TO_SUFFIX.get(key)
    if not suffix:
        raise HTTPException(404, "Unknown demo scenario.")
    insp = db.query(Inspection).filter(Inspection.inspection_code == f"NIR-2026-DEMO-{suffix}").first()
    if not insp:
        raise HTTPException(404, "Demo data not seeded yet. Run: python -m app.seed")
    return _to_detail(insp)


@router.get("", response_model=list[InspectionListItem])
def list_inspections(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    search: Optional[str] = None,
    result: Optional[str] = Query(None, description="COMPLIANT | NON_COMPLIANT | NEEDS_REVIEW"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    q = db.query(Inspection).filter(Inspection.status == "completed")
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Inspection.product_name.ilike(like))
            | (Inspection.brand.ilike(like))
            | (Inspection.inspection_code.ilike(like))
        )
    if result:
        q = q.filter(Inspection.overall_result == result)
    if date_from:
        q = q.filter(Inspection.created_at >= date_from)
    if date_to:
        q = q.filter(Inspection.created_at <= date_to)
    inspections = q.order_by(Inspection.created_at.desc()).limit(200).all()
    return [_to_list_item(i) for i in inspections]


@router.get("/{inspection_id}", response_model=InspectionDetail)
def get_inspection(inspection_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    insp = db.query(Inspection).get(inspection_id)
    if not insp:
        raise HTTPException(404, "Inspection not found")
    return _to_detail(insp)


@router.get("/{inspection_id}/report")
def download_report(inspection_id: int, token: Optional[str] = None, db: Session = Depends(get_db)):
    # Anchor-tag downloads can't set an Authorization header, so this
    # endpoint also accepts the session token as a query parameter.
    if not token or not decode_token(token):
        raise HTTPException(401, "Missing or invalid session token.")

    insp = db.query(Inspection).get(inspection_id)
    if not insp:
        raise HTTPException(404, "Inspection not found")
    if insp.status != "completed":
        raise HTTPException(400, "Run compliance analysis before generating a report.")

    detail = _to_detail(insp).model_dump()
    detail["created_at"] = insp.created_at.strftime("%d %b %Y, %H:%M")
    image_paths = [os.path.join(UPLOAD_DIR, im.file_path) for im in insp.images]

    pdf_bytes = build_report_pdf(detail, image_paths)
    filename = f"{insp.inspection_code}_report.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
