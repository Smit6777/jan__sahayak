"""
PDF Generator Service
Generates filled government forms as PDF
"""

import os
import tempfile
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Field labels in Hindi and English
FIELD_LABELS = {
    "name": "Name / नाम",
    "fatherName": "Father's Name / पिता का नाम",
    "husbandName": "Husband's Name / पति का नाम",
    "aadhar": "Aadhar Number / आधार नंबर",
    "mobile": "Mobile Number / मोबाइल नंबर",
    "bankAccount": "Bank Account / बैंक खाता",
    "ifsc": "IFSC Code / IFSC कोड",
    "address": "Address / पता",
    "currentAddress": "Current Address / वर्तमान पता",
    "landArea": "Land Area / भूमि क्षेत्र",
    "deathCertNo": "Death Certificate No. / मृत्यु प्रमाण पत्र",
    "familyMembers": "Family Members / परिवार के सदस्य",
    "income": "Annual Income / वार्षिक आय",
    "cardType": "Card Type / कार्ड प्रकार",
    "motherName": "Mother's Name / माता का नाम",
    "daughterName": "Daughter's Name / बेटी का नाम",
    "daughterDOB": "Daughter's DOB / बेटी की जन्मतिथि",
    "existingDiseases": "Existing Diseases / मौजूदा बीमारियां",
    "plotSize": "Plot Size / प्लॉट का आकार",
    "category": "Category / वर्ग",
    "bplNumber": "BPL Number / बीपीएल नंबर",
    "cropType": "Crop Type / फसल का प्रकार"
}

SCHEME_DETAILS = {
    "pm-kisan": {
        "title": "PM Kisan Samman Nidhi",
        "title_hi": "पीएम किसान सम्मान निधि",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "ministry_hi": "कृषि एवं किसान कल्याण मंत्रालय",
        "icon": "🌾"
    },
    "vidhva-sahay": {
        "title": "Vidhva Sahay Yojana",
        "title_hi": "विधवा सहाय योजना",
        "ministry": "Social Justice Department, Gujarat",
        "ministry_hi": "सामाजिक न्याय विभाग, गुजरात",
        "icon": "🏠"
    },
    "ration-card": {
        "title": "Ration Card Application",
        "title_hi": "राशन कार्ड आवेदन",
        "ministry": "Food & Civil Supplies Department",
        "ministry_hi": "खाद्य एवं नागरिक आपूर्ति विभाग",
        "icon": "🍚"
    },
    "ayushman-bharat": {
        "title": "Ayushman Bharat",
        "title_hi": "आयुष्मान भारत",
        "ministry": "Ministry of Health and Family Welfare",
        "ministry_hi": "स्वास्थ्य और परिवार कल्याण मंत्रालय",
        "icon": "🏥"
    },
    "pm-awas": {
        "title": "PM Awas Yojana",
        "title_hi": "पीएम आवास योजना",
        "ministry": "Ministry of Housing and Urban Affairs",
        "ministry_hi": "आवासन और शहरी कार्य मंत्रालय",
        "icon": "🏗️"
    },
    "ujjwala": {
        "title": "PM Ujjwala Yojana",
        "title_hi": "पीएम उज्ज्वला योजना",
        "ministry": "Ministry of Petroleum and Natural Gas",
        "ministry_hi": "पेट्रोलियम और प्राकृतिक गैस मंत्रालय",
        "icon": "🔥"
    },
    "sukanya-samriddhi": {
        "title": "Sukanya Samriddhi Yojana",
        "title_hi": "सुकन्या समृद्धि योजना",
        "ministry": "Ministry of Finance",
        "ministry_hi": "वित्त मंत्रालय",
        "icon": "👧"
    },
    "kisan-credit": {
        "title": "Kisan Credit Card",
        "title_hi": "किसान क्रेडिट कार्ड",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "ministry_hi": "कृषि एवं किसान कल्याण मंत्रालय",
        "icon": "💳"
    }
}


async def generate_filled_pdf(
    scheme: str,
    fields: Dict[str, Any]
) -> str:
    """
    Generate a filled PDF form
    
    Args:
        scheme: Government scheme ID
        fields: Form field values
    
    Returns:
        Path to generated PDF file
    """
    
    # Create temp file for PDF
    temp_dir = tempfile.gettempdir()
    pdf_path = os.path.join(temp_dir, f"{scheme}_filled_form.pdf")
    
    # Get scheme details
    scheme_info = SCHEME_DETAILS.get(scheme, SCHEME_DETAILS["pm-kisan"])
    
    # Create PDF
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1*cm,
        bottomMargin=1*cm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=10,
        alignment=1  # Center
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.grey,
        alignment=1
    )
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=5
    )
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=5
    )
    
    # Build document content
    elements = []
    
    # Header
    elements.append(Paragraph(f"{scheme_info['icon']} {scheme_info['title']}", title_style))
    elements.append(Paragraph(scheme_info['title_hi'], subtitle_style))
    elements.append(Paragraph(scheme_info['ministry'], subtitle_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Form title
    elements.append(Paragraph("APPLICATION FORM / आवेदन पत्र", header_style))
    elements.append(Spacer(1, 0.3*cm))
    
    # Create form table
    table_data = [["Field / क्षेत्र", "Value / मान"]]
    
    for field_key, field_value in fields.items():
        if field_value:  # Only include filled fields
            label = FIELD_LABELS.get(field_key, field_key)
            table_data.append([label, str(field_value)])
    
    # If no fields filled, add placeholder
    if len(table_data) == 1:
        table_data.append(["No data provided", "—"])
    
    table = Table(table_data, colWidths=[6*cm, 10*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.39, 0.4, 0.95)),  # Purple header
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.Color(0.95, 0.95, 1)),
        ('GRID', (0, 0), (-1, -1), 1, colors.Color(0.8, 0.8, 0.9)),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 1*cm))
    
    # Declaration section
    elements.append(Paragraph("DECLARATION / घोषणा", header_style))
    declaration_text = """
    I hereby declare that the information provided above is true and correct to the best of my knowledge. 
    I understand that any false information may lead to rejection of my application.
    <br/><br/>
    मैं एतद्द्वारा घोषणा करता/करती हूं कि ऊपर दी गई जानकारी मेरी जानकारी के अनुसार सत्य और सही है।
    """
    elements.append(Paragraph(declaration_text, normal_style))
    elements.append(Spacer(1, 1*cm))
    
    # Signature section
    sig_table = Table([
        ["Date / दिनांक: _______________", "Signature / हस्ताक्षर: _______________"]
    ], colWidths=[8*cm, 8*cm])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    elements.append(sig_table)
    
    # Footer
    elements.append(Spacer(1, 1*cm))
    footer_text = "Generated by Jan-Sahayak | AI for Bharat Hackathon 2026"
    elements.append(Paragraph(footer_text, subtitle_style))
    
    # Build PDF
    doc.build(elements)
    
    return pdf_path
