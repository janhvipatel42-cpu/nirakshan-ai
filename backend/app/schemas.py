import datetime as dt
from typing import Any, Optional

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None  # "inspector" | "admin" — used to validate the tab the user picked


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    designation: Optional[str] = "Legal Metrology Inspector"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    designation: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    token: str
    user: UserOut


class InspectionCreateRequest(BaseModel):
    product_category: str
    product_name: str
    brand: str
    other_details: Optional[str] = ""
    is_imported: bool = False
    demo_scenario: Optional[str] = None  # "compliant" | "non_compliant" | "needs_review"


class ImageAssetOut(BaseModel):
    id: int
    image_type: str
    url: str

    class Config:
        from_attributes = True


class InspectionListItem(BaseModel):
    id: int
    inspection_code: str
    product_name: str
    brand: Optional[str]
    category: Optional[str] = None
    inspector_name: Optional[str] = None
    status: str
    overall_result: Optional[str]
    issues_count: int
    created_at: dt.datetime
    is_demo: bool

    class Config:
        from_attributes = True


class InspectionDetail(BaseModel):
    id: int
    inspection_code: str
    product_category: Optional[str]
    product_name: Optional[str]
    brand: Optional[str]
    other_details: Optional[str]
    is_imported: bool
    inspector_name: Optional[str] = None
    status: str
    overall_result: Optional[str]
    issues_count: int
    image_quality: dict
    ocr_text: str
    ocr_mode: str
    extracted_data: dict
    rule_results: list
    images: list[ImageAssetOut]
    is_demo: bool
    created_at: dt.datetime
    completed_at: Optional[dt.datetime]

    class Config:
        from_attributes = True


class RuleOut(BaseModel):
    id: int
    rule_id: str
    name: str
    requirement: str
    legal_reference: str
    applicability: str
    field_key: str
    check_type: str
    version: str
    active: bool

    class Config:
        from_attributes = True


class RuleUpdateRequest(BaseModel):
    active: Optional[bool] = None
    requirement: Optional[str] = None
    version: Optional[str] = None


class DashboardStats(BaseModel):
    total_inspections: int
    compliant: int
    non_compliant: int
    needs_review: int
    recent: list[InspectionListItem]


class AnalyticsResponse(BaseModel):
    total_inspections: int
    compliance_rate: float
    by_result: dict
    violations_by_requirement: list
    recent: list[InspectionListItem]
