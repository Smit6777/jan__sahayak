"""
PDF Generator Service - REAL Government Form Filler
====================================================
Downloads the official government PDF forms and overlays the
user's voice-extracted data at the correct field coordinates.
Also supports embedding a passport photo and attaching additional 
documents (Aadhar copy, income certificate, etc.) as extra pages.

Uses PyMuPDF (fitz) for all PDF operations.
"""

import os
import io
import tempfile
from typing import Dict, Any, Optional, List

import fitz  # PyMuPDF

# ── Path to downloaded government forms ──────────────────────────────────────
FORMS_DIR = os.path.join(os.path.dirname(__file__), "..", "forms")

# ── Blue ink colour for filled text (looks handwritten) ──────────────────────
INK   = (0.04, 0.18, 0.55)   # dark navy-blue  (R, G, B as 0-1 floats)
RED   = (0.8, 0.0, 0.0)
GREEN = (0.0, 0.5, 0.1)


# ──────────────────────────────────────────────────────────────────────────────
# Field-coordinate maps for each scheme's REAL government PDF.
#
# Each tuple is: (page_index, x, y, max_width_pts, font_size)
# x, y are in PDF point coordinates (origin = bottom-left in PDF, but
# PyMuPDF uses TOP-LEFT, so we supply the values already in top-left
# frame as measured by our analysis script).
# ──────────────────────────────────────────────────────────────────────────────

FIELD_MAPS = {

    # ── UJJWALA YOJANA (Page 0) ───────────────────────────────────────────────
    # Official KYC form from pmuy.gov.in
    "ujjwala": {
        "form_file": "ujjwala.pdf",
        "fields": {
            "name":        (0, 290, 367, 200, 9),
            "gender":      (0, 370, 363,  80, 9),
            "aadhar":      (0, 450, 363, 130, 9),
            "mobile":      (1,  95, 88,  130, 9),
            "bankAccount": (0, 200, 505, 330, 9),
            "ifsc":        (0, 430, 493, 130, 9),
            "address":     (0, 200, 545, 360, 9),
        },
        # Paste photo box is at ~(477, 116) – top-left of the box
        "photo_rect": fitz.Rect(477, 90, 560, 155),   # page 0
    },

    # ── PM KISAN (Page 0) ─────────────────────────────────────────────────────
    # Assam District offline registration form (standard across states)
    "pm-kisan": {
        "form_file": "pm-kisan.pdf",
        "fields": {
            "name":        (0, 250, 370, 300, 9),
            "fatherName":  (0, 260, 399, 290, 9),
            "gender":      (0, 180, 423, 120, 9),
            "mobile":      (0, 200, 929,  180, 9),
            "aadhar":      (0, 350, 564, 200, 9),
            "bankAccount": (0, 250, 806, 300, 9),
            "ifsc":        (0, 200, 738, 200, 9),
            "address":     (0, 200, 656, 350, 9),
            "landArea":    (1,  80,  56, 200, 9),
        },
        "photo_rect": None,
    },

    # ── SUKANYA SAMRIDDHI (Page 0) ────────────────────────────────────────────
    "sukanya-samriddhi": {
        "form_file": "sukanya-samriddhi.pdf",
        "fields": {
            "daughterName": (0, 280, 223, 260, 9),
            "fatherName":   (0, 270, 235, 270, 9),
            "motherName":   (0, 270, 235, 270, 9),   # same row, suffix
            "daughterDOB":  (0, 200, 247, 200, 9),
            "name":         (0, 270, 370, 260, 9),   # guardian
            "aadhar":       (0, 270, 395, 200, 9),
            "address":      (0, 200, 467, 350, 9),
            "bankAccount":  (0, 200, 510, 280, 9),
            "mobile":       (0, 400, 467,  160, 9),
        },
        "photo_rect": None,
    },

    # ── KISAN CREDIT CARD (Page 0) ────────────────────────────────────────────
    "kisan-credit": {
        "form_file": "kisan-credit.pdf",
        "fields": {
            "name":        (0, 200, 150, 300, 9),
            "fatherName":  (0, 200, 175, 300, 9),
            "aadhar":      (0, 200, 200, 200, 9),
            "mobile":      (0, 200, 220, 180, 9),
            "landArea":    (0, 200, 260, 150, 9),
            "cropType":    (0, 200, 280, 200, 9),
            "bankAccount": (0, 200, 320, 300, 9),
            "ifsc":        (0, 200, 340, 180, 9),
            "address":     (0, 200, 380, 350, 9),
        },
        "photo_rect": None,
    },

    # ── RATION CARD (no downloaded PDF — use summary sheet) ───────────────────
    "ration-card": None,

    # ── VIDHVA SAHAY (no downloaded PDF — use summary sheet) ─────────────────
    "vidhva-sahay": None,

    # ── AYUSHMAN BHARAT (no downloadable form) ────────────────────────────────
    "ayushman-bharat": None,

    # ── PM AWAS (no downloadable form) ───────────────────────────────────────
    "pm-awas": None,
}


# ──────────────────────────────────────────────────────────────────────────────
# Bilingual labels (English / Hindi) shown on the summary sheet
# ──────────────────────────────────────────────────────────────────────────────
FIELD_LABELS_BI = {
    "name":             "Full Name / पूरा नाम",
    "fatherName":       "Father's Name / पिता का नाम",
    "motherName":       "Mother's Name / माता का नाम",
    "husbandName":      "Husband's Name / पति का नाम",
    "daughterName":     "Daughter's Name / पुत्री का नाम",
    "daughterDOB":      "Daughter's DOB / पुत्री की जन्मतिथि",
    "aadhar":           "Aadhaar No. / आधार संख्या",
    "mobile":           "Mobile / मोबाइल",
    "bankAccount":      "Bank Account / बैंक खाता",
    "ifsc":             "IFSC Code",
    "address":          "Address / पता",
    "currentAddress":   "Current Address / वर्तमान पता",
    "landArea":         "Land Area (ha) / भूमि (हे.)",
    "cropType":         "Crop Type / फसल",
    "income":           "Income / आय",
    "familyMembers":    "Family Members / परिवार",
    "cardType":         "Card Type / कार्ड प्रकार",
    "bplNumber":        "BPL No. / BPL नंबर",
    "category":         "Category / वर्ग",
    "plotSize":         "Plot Size / प्लॉट",
    "deathCertNo":      "Death Cert. No.",
    "existingDiseases": "Diseases / बीमारियां",
}

SCHEME_TITLES = {
    "pm-kisan":          ("PM Kisan Samman Nidhi", "प्रधानमंत्री किसान सम्मान निधि"),
    "vidhva-sahay":      ("Vidhva Sahay Yojana", "विधवा सहाय योजना"),
    "ration-card":       ("Ration Card Application", "राशन कार्ड आवेदन"),
    "ayushman-bharat":   ("Ayushman Bharat – PMJAY", "आयुष्मान भारत"),
    "pm-awas":           ("PM Awas Yojana", "प्रधानमंत्री आवास योजना"),
    "ujjwala":           ("PM Ujjwala Yojana", "प्रधानमंत्री उज्ज्वला योजना"),
    "sukanya-samriddhi": ("Sukanya Samriddhi Yojana", "सुकन्या समृद्धि योजना"),
    "kisan-credit":      ("Kisan Credit Card", "किसान क्रेडिट कार्ड"),
}


# ──────────────────────────────────────────────────────────────────────────────
# HELPER: overlay one text value onto a page at (x, y)
# ──────────────────────────────────────────────────────────────────────────────
def _write_text(page: fitz.Page, x: float, y: float,
                text: str, fontsize: float = 9,
                color: tuple = INK, max_width: float = 300):
    """Insert text at absolute position (x, y) in PDF point units."""
    if not text:
        return
    # Clip overly long values to avoid overflow
    page.insert_text(
        fitz.Point(x, y),
        text,
        fontsize=fontsize,
        color=color,
        fontname="helv",   # built-in Helvetica
    )


# ──────────────────────────────────────────────────────────────────────────────
# HELPER: paste an image (bytes) into a Rect on a page
# ──────────────────────────────────────────────────────────────────────────────
def _paste_image(page: fitz.Page, rect: fitz.Rect, img_bytes: bytes):
    """Embed a JPEG/PNG image into the given rectangle on the page."""
    page.insert_image(rect, stream=img_bytes)


# ──────────────────────────────────────────────────────────────────────────────
# HELPER: append a new page with an attached document image
# ──────────────────────────────────────────────────────────────────────────────
def _append_doc_page(doc: fitz.Document, img_bytes: bytes, label: str):
    """Add an extra page at the end showing an uploaded supporting document."""
    page = doc.new_page(width=595, height=842)

    # Header label
    page.insert_text(fitz.Point(72, 50), label,
                     fontsize=12, color=INK, fontname="helv")
    page.draw_line(fitz.Point(72, 58), fitz.Point(523, 58), color=INK, width=1)

    # Image centred in the page
    img_rect = fitz.Rect(72, 70, 523, 780)
    page.insert_image(img_rect, stream=img_bytes)


# ──────────────────────────────────────────────────────────────────────────────
# HELPER: generate a "pre-filled summary sheet" for schemes without a real PDF
# ──────────────────────────────────────────────────────────────────────────────
def _summary_sheet(scheme: str, fields: Dict[str, Any],
                   photo_bytes: Optional[bytes] = None) -> fitz.Document:
    """Return a new fitz.Document containing a bilingual pre-filled summary."""
    from datetime import date

    doc  = fitz.Document()
    page = doc.new_page(width=595, height=842)

    en_title, hi_title = SCHEME_TITLES.get(scheme, (scheme, scheme))

    # ── Navy header bar ──
    page.draw_rect(fitz.Rect(0, 0, 595, 80),
                   color=None, fill=(0.0, 0.2, 0.45))
    page.insert_text(fitz.Point(24, 30), en_title,
                     fontsize=14, color=(1, 1, 1), fontname="helv")
    page.insert_text(fitz.Point(24, 50), hi_title,
                     fontsize=11, color=(0.9, 0.9, 1), fontname="helv")
    page.insert_text(fitz.Point(24, 68),
                     "Pre-filled Application Summary  |  Jan-Sahayak AI  |  " + date.today().strftime("%d %b %Y"),
                     fontsize=8, color=(0.8, 0.8, 1), fontname="helv")

    # ── Instruction box ──
    page.draw_rect(fitz.Rect(24, 90, 571, 115), color=(1, 0.6, 0.0), fill=(1, 0.97, 0.88))
    page.insert_text(fitz.Point(30, 106),
        "This summary was prepared by Jan-Sahayak. Please carry this and all originals to the nearest CSC/Government office to complete e-KYC.",
        fontsize=7.5, color=(0.6, 0.2, 0.0), fontname="helv")

    # ── Photo box (top-right) ──
    photo_rect = fitz.Rect(440, 125, 555, 220)
    page.draw_rect(photo_rect, color=(0.6, 0.6, 0.8), fill=(0.95, 0.95, 1.0))
    if photo_bytes:
        page.insert_image(photo_rect, stream=photo_bytes)
    else:
        page.insert_text(fitz.Point(450, 170), "PHOTO", fontsize=9, color=(0.5, 0.5, 0.6))
        page.insert_text(fitz.Point(445, 183), "ATTACH", fontsize=8, color=(0.5, 0.5, 0.6))

    # ── Field rows ──
    y = 130
    for field_key, value in fields.items():
        if not str(value).strip():
            continue
        label = FIELD_LABELS_BI.get(field_key, field_key)

        # Shaded label bg
        page.draw_rect(fitz.Rect(24, y - 2, 210, y + 14),
                       color=None, fill=(0.9, 0.92, 1.0))
        page.insert_text(fitz.Point(28, y + 10), label,
                         fontsize=8, color=(0.05, 0.15, 0.45), fontname="helv")

        # Value
        page.draw_rect(fitz.Rect(210, y - 2, 430, y + 14),
                       color=(0.75, 0.75, 0.85), fill=(1, 1, 1))
        page.insert_text(fitz.Point(215, y + 10), str(value)[:55],
                         fontsize=9, color=INK, fontname="helv")

        # Separator line
        page.draw_line(fitz.Point(24, y + 15), fitz.Point(430, y + 15),
                       color=(0.8, 0.82, 0.9), width=0.4)
        y += 20

        if y > 700:   # page break
            page = doc.new_page(width=595, height=842)
            y = 50

    # ── Declaration ──
    y += 10
    page.draw_rect(fitz.Rect(24, y, 571, y + 58), color=None, fill=(0.93, 0.95, 1.0))
    page.insert_text(fitz.Point(30, y + 14),
        "DECLARATION: I hereby confirm that the above information is true and correct to the best of my knowledge.",
        fontsize=7.5, color=(0.05, 0.1, 0.4), fontname="helv")
    page.insert_text(fitz.Point(30, y + 26),
        "घोषणा: मैं एतद्द्वारा प्रमाणित करता/करती हूं कि उपर्युक्त जानकारी सत्य और सही है।",
        fontsize=7.5, color=(0.1, 0.1, 0.45), fontname="helv")
    page.insert_text(fitz.Point(30, y + 50),
        "Applicant's Signature / आवेदक के हस्ताक्षर: ___________________________",
        fontsize=8, color=(0.15, 0.15, 0.15), fontname="helv")

    # ── Footer ──
    page.draw_rect(fitz.Rect(0, 822, 595, 842), color=None, fill=(0.0, 0.2, 0.45))
    page.insert_text(fitz.Point(180, 835),
        "Generated by Jan-Sahayak | AI for Bharat Hackathon 2026",
        fontsize=7, color=(1, 1, 1), fontname="helv")

    return doc


# ──────────────────────────────────────────────────────────────────────────────
# PUBLIC API
# ──────────────────────────────────────────────────────────────────────────────

async def generate_filled_pdf(
    scheme: str,
    fields: Dict[str, Any],
    photo_bytes: Optional[bytes] = None,
    extra_docs: Optional[List[Dict]] = None   # [{"label": "Aadhar Copy", "bytes": b"..."}]
) -> str:
    """
    Fill the real government form PDF with the user's data.

    For schemes that have a downloadable government PDF, it overlays text directly
    on the official form at the correct positions.

    For online-only schemes, generates a professional bilingual Pre-filled Summary
    Sheet that the user can carry to a CSC/government office.

    Optionally embeds a passport photo and appends additional document images as
    extra pages (Aadhar copy, income certificate, etc.).

    Returns:
        Absolute path to the output PDF file.
    """
    field_map = FIELD_MAPS.get(scheme)

    if field_map is None:
        # ── No real PDF available → generate summary sheet ────────────────
        doc = _summary_sheet(scheme, fields, photo_bytes)
    else:
        # ── Open the real government form ────────────────────────────────
        form_path = os.path.join(FORMS_DIR, field_map["form_file"])
        if not os.path.isfile(form_path):
            # Fallback to summary sheet if file missing
            doc = _summary_sheet(scheme, fields, photo_bytes)
        else:
            doc = fitz.open(form_path)

            # Overlay each field value at its mapped coordinate
            coord_map = field_map.get("fields", {})
            for field_key, value in fields.items():
                if field_key not in coord_map:
                    continue
                if not str(value).strip():
                    continue

                pg_idx, x, y, max_w, fsize = coord_map[field_key]
                if pg_idx >= len(doc):
                    continue
                page = doc[pg_idx]
                _write_text(page, x, y, str(value), fontsize=fsize,
                            color=INK, max_width=max_w)

            # Paste passport photo if provided and form has a photo box
            if photo_bytes and field_map.get("photo_rect"):
                page = doc[0]
                _paste_image(page, field_map["photo_rect"], photo_bytes)

    # ── Append extra supporting document pages ───────────────────────────────
    if extra_docs:
        for doc_item in extra_docs:
            label = doc_item.get("label", "Supporting Document")
            img_bytes = doc_item.get("bytes")
            if img_bytes:
                _append_doc_page(doc, img_bytes, label)

    # ── Save to temp file ────────────────────────────────────────────────────
    temp_dir  = tempfile.gettempdir()
    out_path  = os.path.join(temp_dir, f"{scheme}_filled_form.pdf")
    doc.save(out_path)
    doc.close()

    return out_path
