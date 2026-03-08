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

    # ── UJJWALA YOJANA 5.0 KYC form (pmuy.gov.in) ────────────────────────────
    # Page: 595 x 842 pts.
    # 'fields'  → tuple (page, x, y, max_w, fontsize)  ← free-text overlay
    # 'box_fields' → tuple (page, x_start, y_center, box_w, max_boxes)  ← char-per-box
    "ujjwala": {
        "form_file": "ujjwala.pdf",
        # Free-text fields (blank line or wide cell — just write the value)
        "fields": {},
        # Box-grid fields — one UPPERCASE char per box
        # Measured from actual form: boxes start after label column
        # Section a) Name: label col ends ~x=130, box_w≈8.6pt, row height≈11pt
        # Rows: FirstName y=147, MiddleName y=158, LastName y=170, Aadhaar y=181, Mobile y=192
        # Section d) Bank: boxes start x≈170 for rows y=471(BankAcctName),482(BankName),494(Branch),505(AcctNo)
        #             IFSC: starts x≈389, y=494
        "box_fields": {
            # Section a) Name
            "name":        (0,  131.0, 152.0, 14.2, 22),   # First Name (y=152.0)
            "aadhar":      (0,  131.0, 184.6, 14.2, 16),   # Aadhaar (y=184.6)
            "mobile":      (0,  131.0, 197.4, 14.2, 10),   # Mobile (y=197.4)
            "dob_d":       (0,  429.7, 198.9, 14.1, 2),    # DD
            "dob_m":       (0,  457.7, 198.9, 14.1, 2),    # MM
            "dob_y":       (0,  486.5, 198.9, 14.1, 4),    # YYYY

            # Section d) Bank
            "bankAccountName": (0, 151.1, 475.0, 11.3, 20),
            "bankName":    (0,  151.1, 487.2, 11.3, 20),   
            "branchName":  (0,  151.1, 498.6, 11.3, 20),   
            "ifsc":        (0,  406.2, 498.6, 13.3, 11),   
            "bankAccount": (0,  151.1, 509.9, 11.3, 20),   

            # Section b) Address 
            "houseName":   (0,  151.1, 248.7, 11.3, 20),
            "street":      (0,  151.1, 270.9, 11.3, 20),
            "village":     (0,  151.1, 294.1, 11.3, 20),
            "subDistrict": (0,  151.1, 305.9, 11.3, 20),
            "district":    (0,  151.1, 316.9, 11.3, 20),
            "state":       (0,  151.1, 327.9, 11.3, 20),
            "pinCode":     (0,  415.0, 294.1, 11.3, 6),
            
            # Ration card no.
            "bplNumber":   (0,  151.1, 541.0, 11.3, 18),   # Ration no. 
        },
        "fields": {
            "category": (0, 230.0, 204.0, 150.0, 10), # Will just write SC/ST/General near the boxes
        },
        "photo_rect": fitz.Rect(467, 112, 555, 170),
    },

    # ── PM KISAN (Page 0) ─────────────────────────────────────────────────────
    # Page: 612 x 1008 pts. Plain text after colon (x>264... wait, colon is at x=253.6).
    "pm-kisan": {
        "form_file": "pm-kisan.pdf",
        "fields": {
            "state":       (0, 264.0, 255.0,  290, 9),
            "district":    (0, 264.0, 278.0,  290, 9),
            "subDistrict": (0, 264.0, 302.0,  290, 9),
            "village":     (0, 264.0, 349.0,  290, 9),
            "name":        (0, 264.0, 371.0,  290, 9),
            "fatherName":  (0, 264.0, 400.0,  290, 9),
            "gender":      (0, 264.0, 424.0,  200, 9),
            "category":    (0, 264.0, 448.0,  200, 9),
            "aadhar":      (0, 264.0, 628.0,  200, 9),
            "address":     (0, 264.0, 656.0,  350, 9),
            "pinCode":     (0, 264.0, 675.0,  100, 9),
            "ifsc":        (0, 264.0, 738.0,  250, 9),
            "bankName":    (0, 264.0, 762.0,  250, 9),
            "bankAccount": (0, 264.0, 807.0,  290, 9),
            "mobile":      (0, 264.0, 929.0,  200, 9),
        },
        "box_fields": {},
        "photo_rect": None,
    },


    # ── SUKANYA SAMRIDDHI (Page 0) ────────────────────────────────────────────
    "sukanya-samriddhi": {
        "form_file": "sukanya-samriddhi.pdf",
        "fields": {
            "daughterName": (0, 280.0, 223.0, 260, 9),
            "fatherName":   (0, 270.0, 235.0, 270, 9),
            "motherName":   (0, 270.0, 235.0, 270, 9), 
            "daughterDOB":  (0, 200.0, 247.0, 200, 9),
            "name":         (0, 270.0, 370.0, 260, 9), 
            "aadhar":       (0, 270.0, 395.0, 200, 9), 
            "address":      (0, 200.0, 467.0, 350, 9),
            "mobile":       (0, 400.0, 467.0, 160, 9),
            "bankAccount":  (0, 200.0, 510.0, 250, 9),
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
    page.insert_text(
        fitz.Point(x, y),
        text,
        fontsize=fontsize,
        color=color,
        fontname="helv",
    )


def _fill_boxes(page: fitz.Page, x_start: float, y_center: float,
                box_w: float, text: str, max_boxes: int,
                fontsize: float = 7, color: tuple = INK):
    """
    Fill a row of character boxes one character at a time.
    - text is converted to UPPERCASE BLOCK LETTERS (as per official form rules)
    - spaces between words = one empty box skipped
    - each character is horizontally centered in its box
    - y_center is the vertical center of the box row
    """
    text = str(text).upper().strip()
    # Replace multiple spaces with single space
    import re
    text = re.sub(r'  +', ' ', text)

    # Estimate char width for centering (Helvetica ~0.55 * fontsize)
    char_px = fontsize * 0.55

    for i, ch in enumerate(text):
        if i >= max_boxes:
            break
        if ch == ' ':
            continue   # leave box blank (space = skip box)
        
        # Exact placement without centering offsets
        x_char = x_start + i * box_w
        page.insert_text(
            fitz.Point(x_char, y_center),
            ch,
            fontsize=fontsize,
            color=color,
            fontname="helv",
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

            # ── Box-grid fields (one UPPERCASE char per box) ──────────────
            box_map = field_map.get("box_fields", {})
            
            # Parse Date of Birth into box parts if present
            if "dob" in fields:
                dob_str = str(fields["dob"]).replace("/", "").replace("-", "").replace(".", "").replace(" ", "")
                if len(dob_str) >= 8:
                    fields["dob_d"] = dob_str[0:2]
                    fields["dob_m"] = dob_str[2:4]
                    fields["dob_y"] = dob_str[4:8]

            for field_key, value in fields.items():
                if field_key not in box_map:
                    continue
                if not str(value).strip():
                    continue
                pg_idx, x_start, y_center, box_w, max_boxes = box_map[field_key]
                if pg_idx >= len(doc):
                    continue
                page = doc[pg_idx]
                _fill_boxes(page, x_start, y_center, box_w,
                            str(value), max_boxes,
                            fontsize=7, color=INK)

            # ── Free-text fields (plain text after colon) ─────────────────
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
                
                # PM Kisan Checkbox placements
                val_str = str(value).strip().upper()
                if scheme == "pm-kisan" and field_key == "gender":
                    if "F" in val_str: x = 327.0
                    else: x = 280.9
                    value = "X"
                elif scheme == "pm-kisan" and field_key == "category":
                    if "SC" in val_str: x = 375.8
                    elif "ST" in val_str: x = 403.7
                    else: x = 280.9
                    value = "X"

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
