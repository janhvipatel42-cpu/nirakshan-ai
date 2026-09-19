import datetime as dt

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def now():
    return dt.datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(300), nullable=False)
    role = Column(String(20), nullable=False, default="inspector")  # inspector | admin
    designation = Column(String(120), default="Legal Metrology Inspector")
    created_at = Column(DateTime, default=now)

    inspections = relationship("Inspection", back_populates="inspector")


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(40), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    requirement = Column(Text, nullable=False)
    legal_reference = Column(String(200), nullable=False)
    applicability = Column(String(200), default="All retail packages")
    field_key = Column(String(60), nullable=False)
    check_type = Column(String(40), default="field_presence")
    version = Column(String(20), default="1.0")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_code = Column(String(40), unique=True, index=True, nullable=False)

    product_category = Column(String(120))
    product_name = Column(String(200))
    brand = Column(String(120))
    other_details = Column(Text)
    is_imported = Column(Boolean, default=False)

    inspector_id = Column(Integer, ForeignKey("users.id"))
    inspector = relationship("User", back_populates="inspections")

    status = Column(String(30), default="draft")
    # draft -> images_uploaded -> quality_checked -> analyzing -> completed

    overall_result = Column(String(30), nullable=True)
    # COMPLIANT | NON_COMPLIANT | NEEDS_REVIEW
    issues_count = Column(Integer, default=0)

    image_quality_json = Column(Text, default="{}")
    ocr_text = Column(Text, default="")
    ocr_mode = Column(String(20), default="pending")  # real | demo | unavailable | pending
    extracted_data_json = Column(Text, default="{}")
    rule_results_json = Column(Text, default="[]")

    is_demo = Column(Boolean, default=False)

    created_at = Column(DateTime, default=now)
    completed_at = Column(DateTime, nullable=True)

    images = relationship("ImageAsset", back_populates="inspection", cascade="all, delete-orphan")


class ImageAsset(Base):
    __tablename__ = "image_assets"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    inspection = relationship("Inspection", back_populates="images")

    image_type = Column(String(20))  # front | back | side | additional
    file_path = Column(String(400))
    original_filename = Column(String(200))
    created_at = Column(DateTime, default=now)
