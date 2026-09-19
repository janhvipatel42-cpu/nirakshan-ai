"""
MODULE 5 (part) — Report Generator

Renders a downloadable PDF inspection report from a completed Inspection
record. Kept as plain, dependency-light reportlab code so it runs the same
whether the inspection came from a live upload or from demo data.
"""
from __future__ import annotations

import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image as RLImage,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

STATUS_COLORS = {
    "PASS": colors.HexColor("#1F8A55"),
    "FAIL": colors.HexColor("#C7362A"),
    "NEEDS_REVIEW": colors.HexColor("#B8791A"),
    "NOT_APPLICABLE": colors.HexColor("#7A8B85"),
}

RESULT_COLORS = {
    "COMPLIANT": colors.HexColor("#1F8A55"),
    "NON_COMPLIANT": colors.HexColor("#C7362A"),
    "NEEDS_REVIEW": colors.HexColor("#B8791A"),
}


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle(name="Brand", fontSize=18, leading=22, textColor=colors.HexColor("#0B2545"), fontName="Helvetica-Bold"))
    ss.add(ParagraphStyle(name="Tagline", fontSize=9, textColor=colors.HexColor("#5B6B65")))
    ss.add(ParagraphStyle(name="SectionHead", fontSize=12, leading=16, spaceBefore=14, spaceAfter=6, textColor=colors.HexColor("#0B2545"), fontName="Helvetica-Bold"))
    ss.add(ParagraphStyle(name="Body", fontSize=9.5, leading=14, textColor=colors.HexColor("#10231C")))
    ss.add(ParagraphStyle(name="Small", fontSize=8, leading=11, textColor=colors.HexColor("#5B6B65")))
    return ss


def build_report_pdf(inspection: dict, image_paths: list[str]) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=18 * mm, bottomMargin=16 * mm, leftMargin=18 * mm, rightMargin=18 * mm,
    )
    ss = _styles()
    story = []

    story.append(Paragraph("NIRAKSHAN AI", ss["Brand"]))
    story.append(Paragraph("AI-Powered Packaged Commodity Compliance Inspection System — Inspection Report", ss["Tagline"]))
    story.append(Spacer(1, 10))

    meta_rows = [
        ["Inspection ID", inspection["inspection_code"], "Date", inspection["created_at"]],
        ["Inspector", inspection.get("inspector_name") or "—", "Category", inspection.get("product_category") or "—"],
        ["Product", inspection.get("product_name") or "—", "Brand", inspection.get("brand") or "—"],
    ]
    meta_table = Table(meta_rows, colWidths=[28 * mm, 62 * mm, 22 * mm, 58 * mm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#10231C")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#D8E0DC")),
    ]))
    story.append(meta_table)

    if inspection.get("is_demo"):
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            "This inspection was generated from PROTOTYPE SAMPLE DATA for demonstration "
            "purposes and is not a real legal determination.", ss["Small"]))

    story.append(Spacer(1, 14))
    overall = inspection.get("overall_result") or "PENDING"
    result_color = RESULT_COLORS.get(overall, colors.grey)
    result_table = Table(
        [[Paragraph(f"OVERALL RESULT: <b>{overall.replace('_', ' ')}</b>", ss["Body"]),
          f"{inspection.get('issues_count', 0)} issue(s) detected"]],
        colWidths=[110 * mm, 60 * mm],
    )
    result_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.Color(*[c / 255 for c in
            (result_color.red * 255, result_color.green * 255, result_color.blue * 255)], alpha=0.12)),
        ("BOX", (0, 0), (-1, -1), 0.6, result_color),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(result_table)

    story.append(Paragraph("Compliance Check Summary", ss["SectionHead"]))
    header = ["Requirement", "Legal Reference", "Status", "Confidence"]
    rows = [header]
    for r in inspection.get("rule_results", []):
        conf = f"{r['confidence']}%" if r.get("confidence") is not None else "—"
        rows.append([r["name"], r["legal_reference"], r["status"].replace("_", " "), conf])
    check_table = Table(rows, colWidths=[58 * mm, 68 * mm, 30 * mm, 18 * mm], repeatRows=1)
    style = [
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B2545")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D8E0DC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    for i, r in enumerate(inspection.get("rule_results", []), start=1):
        style.append(("TEXTCOLOR", (2, i), (2, i), STATUS_COLORS.get(r["status"], colors.black)))
        style.append(("FONTNAME", (2, i), (2, i), "Helvetica-Bold"))
    check_table.setStyle(TableStyle(style))
    story.append(check_table)

    issue_results = [r for r in inspection.get("rule_results", []) if r["status"] != "PASS"]
    if issue_results:
        story.append(Paragraph("Violation & Review Details", ss["SectionHead"]))
        for r in issue_results:
            story.append(Paragraph(f"<b>{r['name']}</b> — {r['status'].replace('_', ' ')}", ss["Body"]))
            story.append(Paragraph(r["explanation"], ss["Small"]))
            story.append(Spacer(1, 6))

    if image_paths:
        story.append(Paragraph("Photographic Evidence", ss["SectionHead"]))
        imgs_row = []
        for p in image_paths[:3]:
            try:
                imgs_row.append(RLImage(p, width=52 * mm, height=52 * mm))
            except Exception:
                continue
        if imgs_row:
            evidence_table = Table([imgs_row])
            evidence_table.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4)]))
            story.append(evidence_table)

    story.append(Spacer(1, 16))
    story.append(Paragraph(
        "This is an AI-assisted preliminary compliance inspection generated by Nirakshan AI. "
        "It is intended to support, not replace, review by an authorised Legal Metrology "
        "Officer under the Legal Metrology Act, 2009 and the Legal Metrology (Packaged "
        "Commodities) Rules, 2011. Final compliance determinations rest with the competent authority.",
        ss["Small"],
    ))
    story.append(Paragraph(f"Reviewer/Inspector: {inspection.get('inspector_name') or '—'}", ss["Small"]))

    doc.build(story)
    return buf.getvalue()
